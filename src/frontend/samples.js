// Built-in drum kit synthesized with Web Audio, so the repo ships no audio files.

function noiseSource(ctx, duration) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  return src;
}

function envelope(ctx, peak, attack, decay, start = 0) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  return g;
}

function tone(ctx, out, { type = 'sine', from, to, sweep, peak, decay }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, 0);
  osc.frequency.exponentialRampToValueAtTime(to, sweep);
  const env = envelope(ctx, peak, 0.002, decay);
  osc.connect(env).connect(out);
  osc.start(0);
}

function noise(ctx, out, { filter, freq, q = 1, peak, decay, start = 0, duration }) {
  const src = noiseSource(ctx, duration);
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const env = envelope(ctx, peak, 0.001, decay, start);
  src.connect(f).connect(env).connect(out);
  src.start(start);
}

export const SAMPLES = [
  {
    id: 'kick', name: 'Kick', group: 'Kicks', duration: 0.6,
    render: (ctx, out) => tone(ctx, out, { from: 160, to: 45, sweep: 0.12, peak: 1, decay: 0.5 }),
  },
  {
    id: 'kick_punch', name: 'Kick Punch', group: 'Kicks', duration: 0.4,
    render: (ctx, out) => {
      tone(ctx, out, { from: 220, to: 55, sweep: 0.05, peak: 1, decay: 0.3 });
      noise(ctx, out, { filter: 'lowpass', freq: 3000, peak: 0.5, decay: 0.02, duration: 0.05 });
    },
  },
  {
    id: '808', name: '808', group: 'Kicks', duration: 1.6,
    render: (ctx, out) => tone(ctx, out, { from: 120, to: 42, sweep: 0.08, peak: 0.95, decay: 1.5 }),
  },
  {
    id: 'snare', name: 'Snare', group: 'Snares', duration: 0.35,
    render: (ctx, out) => {
      tone(ctx, out, { type: 'triangle', from: 240, to: 160, sweep: 0.05, peak: 0.6, decay: 0.12 });
      noise(ctx, out, { filter: 'highpass', freq: 1500, peak: 0.7, decay: 0.25, duration: 0.35 });
    },
  },
  {
    id: 'clap', name: 'Clap', group: 'Snares', duration: 0.4,
    render: (ctx, out) => {
      for (const start of [0, 0.012, 0.024]) {
        noise(ctx, out, { filter: 'bandpass', freq: 1200, q: 1.5, peak: 0.8, decay: 0.03, start, duration: 0.4 });
      }
      noise(ctx, out, { filter: 'bandpass', freq: 1200, q: 1.5, peak: 0.6, decay: 0.3, start: 0.036, duration: 0.4 });
    },
  },
  {
    id: 'rim', name: 'Rim', group: 'Snares', duration: 0.12,
    render: (ctx, out) => tone(ctx, out, { type: 'square', from: 1700, to: 1600, sweep: 0.02, peak: 0.4, decay: 0.05 }),
  },
  {
    id: 'hat_closed', name: 'Hat Closed', group: 'Hats', duration: 0.1,
    render: (ctx, out) => noise(ctx, out, { filter: 'highpass', freq: 7000, peak: 0.5, decay: 0.05, duration: 0.1 }),
  },
  {
    id: 'hat_open', name: 'Hat Open', group: 'Hats', duration: 0.5,
    render: (ctx, out) => noise(ctx, out, { filter: 'highpass', freq: 6500, peak: 0.45, decay: 0.4, duration: 0.5 }),
  },
  {
    id: 'shaker', name: 'Shaker', group: 'Hats', duration: 0.15,
    render: (ctx, out) => noise(ctx, out, { filter: 'bandpass', freq: 9000, q: 0.8, peak: 0.35, decay: 0.08, duration: 0.15 }),
  },
  {
    id: 'crash', name: 'Crash', group: 'Hats', duration: 1.8,
    render: (ctx, out) => noise(ctx, out, { filter: 'highpass', freq: 4500, peak: 0.45, decay: 1.6, duration: 1.8 }),
  },
  {
    id: 'tom_low', name: 'Tom Low', group: 'Percussion', duration: 0.5,
    render: (ctx, out) => tone(ctx, out, { from: 140, to: 90, sweep: 0.2, peak: 0.8, decay: 0.4 }),
  },
  {
    id: 'tom_high', name: 'Tom High', group: 'Percussion', duration: 0.4,
    render: (ctx, out) => tone(ctx, out, { from: 260, to: 180, sweep: 0.15, peak: 0.8, decay: 0.3 }),
  },
  {
    id: 'cowbell', name: 'Cowbell', group: 'Percussion', duration: 0.35,
    render: (ctx, out) => {
      tone(ctx, out, { type: 'square', from: 545, to: 540, sweep: 0.3, peak: 0.25, decay: 0.3 });
      tone(ctx, out, { type: 'square', from: 815, to: 810, sweep: 0.3, peak: 0.25, decay: 0.3 });
    },
  },
];

export function findSample(id) {
  return SAMPLES.find((s) => s.id === id) ?? null;
}

export function sampleGroups() {
  const groups = new Map();
  for (const s of SAMPLES) {
    if (!groups.has(s.group)) groups.set(s.group, []);
    groups.get(s.group).push(s);
  }
  return [...groups.entries()];
}

export async function renderSample(sample, sampleRate) {
  const ctx = new OfflineAudioContext(1, Math.ceil(sampleRate * sample.duration), sampleRate);
  const out = ctx.createGain();
  out.connect(ctx.destination);
  sample.render(ctx, out);
  return ctx.startRendering();
}
