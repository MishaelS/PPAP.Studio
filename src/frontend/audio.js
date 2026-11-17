import { isAudible, stepDuration } from './project.js';
import { SAMPLES, renderSample } from './samples.js';
import { encodeWav } from './wav.js';
import {
  EXPORT_LOOPS, EXPORT_TAIL, LIMITER_RATIO, LIMITER_THRESHOLD_DB, MASTER_GAIN, NO_STEP,
  PREVIEW_VOLUME, SCHEDULE_LOOKAHEAD, SCHEDULER_TICK_MS, START_DELAY,
} from '../backend/constants.js';
import { t } from './i18n.js';

// Steps whose start time falls before `until`, continuing from the given position.
export function scheduleWindow({ nextTime, step, until, bpm, steps }) {
  const hits = [];
  const dur = stepDuration(bpm);
  let time = nextTime;
  let current = step % steps;
  while (time < until) {
    hits.push({ step: current, time });
    time += dur;
    current = (current + 1) % steps;
  }
  return { hits, nextTime: time, step: current };
}

export function channelsForStep(project, step) {
  return project.channels.filter((c) => c.pattern[step] && isAudible(c, project.channels));
}

function createOutput(ctx) {
  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = LIMITER_THRESHOLD_DB;
  limiter.ratio.value = LIMITER_RATIO;
  master.connect(limiter).connect(ctx.destination);
  return master;
}

function playHit(ctx, out, buffer, time, channel) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = channel.volume;
  const pan = ctx.createStereoPanner();
  pan.pan.value = channel.pan;
  src.connect(gain).connect(pan).connect(out);
  src.start(time);
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.out = null;
    this.buffers = new Map();
    this.project = null;
    this.playing = false;
    this.timer = null;
    this.queue = [];
    this.lastStep = NO_STEP;
    this.ready = null;
  }

  // Must be called from a user gesture: browsers block audio until then.
  init() {
    if (!this.ready) {
      this.ready = (async () => {
        const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Ctx) throw new Error(t('error.noWebAudio'));
        this.ctx = new Ctx();
        this.out = createOutput(this.ctx);
        await Promise.all(
          SAMPLES.map(async (s) => this.buffers.set(s.id, await renderSample(s, this.ctx.sampleRate))),
        );
      })();
      this.ready.catch(() => { this.ready = null; });
    }
    return this.ready.then(() => this.ctx.resume());
  }

  setProject(project) {
    this.project = project;
  }

  async preview(sampleId) {
    await this.init();
    const buffer = this.buffers.get(sampleId);
    if (buffer) playHit(this.ctx, this.out, buffer, this.ctx.currentTime, { volume: PREVIEW_VOLUME, pan: 0 });
  }

  async start() {
    await this.init();
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + START_DELAY;
    this.queue = [];
    this.tick();
    this.timer = setInterval(() => this.tick(), SCHEDULER_TICK_MS);
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    this.queue = [];
    this.lastStep = NO_STEP;
  }

  tick() {
    const p = this.project;
    if (!p) return;
    const win = scheduleWindow({
      nextTime: this.nextTime, step: this.step, until: this.ctx.currentTime + SCHEDULE_LOOKAHEAD, bpm: p.bpm, steps: p.steps,
    });
    for (const hit of win.hits) {
      for (const c of channelsForStep(p, hit.step)) {
        const buffer = this.buffers.get(c.sampleId);
        if (buffer) playHit(this.ctx, this.out, buffer, hit.time, c);
      }
      this.queue.push(hit);
    }
    this.nextTime = win.nextTime;
    this.step = win.step;
  }

  // Step currently audible, for the playhead; NO_STEP when stopped.
  currentStep() {
    if (!this.playing) return NO_STEP;
    const now = this.ctx.currentTime;
    while (this.queue.length && this.queue[0].time <= now) this.lastStep = this.queue.shift().step;
    return this.lastStep;
  }

  async exportWav(project, loops = EXPORT_LOOPS) {
    await this.init();
    const sampleRate = this.ctx.sampleRate;
    const dur = stepDuration(project.bpm);
    const length = Math.ceil((project.steps * loops * dur + EXPORT_TAIL) * sampleRate);
    const off = new OfflineAudioContext(2, length, sampleRate);
    const out = createOutput(off);
    for (let i = 0; i < project.steps * loops; i++) {
      for (const c of channelsForStep(project, i % project.steps)) {
        const buffer = this.buffers.get(c.sampleId);
        if (buffer) playHit(off, out, buffer, i * dur, c);
      }
    }
    return encodeWav(await off.startRendering());
  }
}
