import { isAudible, stepDuration } from './project.js';
import { SAMPLES, renderSample } from './samples.js';
import { encodeWav } from './wav.js';

const LOOKAHEAD = 0.1;
const TICK_MS = 25;
const EXPORT_TAIL = 1.5;

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
  master.gain.value = 0.9;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.ratio.value = 12;
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
    this.lastStep = -1;
    this.ready = null;
  }

  // Must be called from a user gesture: browsers block audio until then.
  init() {
    if (!this.ready) {
      this.ready = (async () => {
        const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Ctx) throw new Error('Браузер не поддерживает Web Audio API.');
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
    if (buffer) playHit(this.ctx, this.out, buffer, this.ctx.currentTime, { volume: 0.9, pan: 0 });
  }

  async start() {
    await this.init();
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.queue = [];
    this.tick();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    this.queue = [];
    this.lastStep = -1;
  }

  tick() {
    const p = this.project;
    if (!p) return;
    const win = scheduleWindow({
      nextTime: this.nextTime, step: this.step, until: this.ctx.currentTime + LOOKAHEAD, bpm: p.bpm, steps: p.steps,
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

  // Step currently audible, for the playhead; -1 when stopped.
  currentStep() {
    if (!this.playing) return -1;
    const now = this.ctx.currentTime;
    while (this.queue.length && this.queue[0].time <= now) this.lastStep = this.queue.shift().step;
    return this.lastStep;
  }

  async exportWav(project, loops = 1) {
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
