import {
  DEFAULT_BPM, DEFAULT_CHANNEL_NAME, DEFAULT_PAN, DEFAULT_PROJECT_NAME, DEFAULT_STEPS, DEFAULT_VOLUME,
  MAX_BPM, MIN_BPM, PAN_RANGE, STEP_OPTIONS, STEPS_PER_BEAT, VOLUME_RANGE, clamp, makeId,
} from '../backend/constants.js';
import { t } from './i18n.js';

export class ProjectError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProjectError';
  }
}

export function createChannel(sampleId, name, steps = DEFAULT_STEPS) {
  return {
    id: makeId('c'),
    name: name || sampleId,
    sampleId,
    volume: DEFAULT_VOLUME,
    pan: DEFAULT_PAN,
    mute: false,
    solo: false,
    pattern: new Array(steps).fill(0),
  };
}

export function createProject() {
  const kick = createChannel('kick', 'Kick');
  const clap = createChannel('clap', 'Clap');
  const hat  = createChannel('hat_closed', 'Hat');
  const snare = createChannel('snare', 'Snare');
  //              0  1  2  3  0  1  2  3  0  1  2  3  0  1  2  3
  kick.pattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  clap.pattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
  hat.pattern  = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
  return {
    id: makeId('p'),
    name: DEFAULT_PROJECT_NAME,
    battleId: null,
    bpm: DEFAULT_BPM,
    steps: DEFAULT_STEPS,
    channels: [kick, clap, hat, snare],
  };
}

export function stepDuration(bpm) {
  return 60 / bpm / STEPS_PER_BEAT;
}

export function isAudible(channel, channels) {
  const anySolo = channels.some((c) => c.solo);
  return anySolo ? channel.solo : !channel.mute;
}

function updateChannel(project, channelId, patch) {
  return {
    ...project,
    channels: project.channels.map((c) => (c.id === channelId ? { ...c, ...patch(c) } : c)),
  };
}

export function toggleStep(project, channelId, step) {
  return updateChannel(project, channelId, (c) => {
    const pattern = [...c.pattern];
    pattern[step] = pattern[step] ? 0 : 1;
    return { pattern };
  });
}

export function setChannel(project, channelId, fields) {
  const clean = { ...fields };
  if ('volume' in clean) clean.volume = clamp(Number(clean.volume), ...VOLUME_RANGE);
  if ('pan' in clean) clean.pan = clamp(Number(clean.pan), ...PAN_RANGE);
  if ('name' in clean) clean.name = String(clean.name).trim() || DEFAULT_CHANNEL_NAME;
  return updateChannel(project, channelId, () => clean);
}

export function addChannel(project, sampleId, name) {
  return { ...project, channels: [...project.channels, createChannel(sampleId, name, project.steps)] };
}

export function removeChannel(project, channelId) {
  return { ...project, channels: project.channels.filter((c) => c.id !== channelId) };
}

export function clearChannel(project, channelId) {
  return updateChannel(project, channelId, (c) => ({ pattern: c.pattern.map(() => 0) }));
}

export function setBpm(project, bpm) {
  const value = Math.round(Number(bpm));
  if (!Number.isFinite(value)) return project;
  return { ...project, bpm: clamp(value, MIN_BPM, MAX_BPM) };
}

function resizePattern(pattern, steps) {
  if (pattern.length >= steps) return pattern.slice(0, steps);
  // Growing a pattern repeats it, like FL does when you extend a loop.
  const out = [];
  for (let i = 0; i < steps; i++) out.push(pattern[i % pattern.length] || 0);
  return out;
}

export function setSteps(project, steps) {
  if (!STEP_OPTIONS.includes(steps)) return project;
  return {
    ...project,
    steps,
    channels: project.channels.map((c) => ({ ...c, pattern: resizePattern(c.pattern, steps) })),
  };
}

function fail(message) {
  throw new ProjectError(message);
}

// Validates untrusted JSON (imported files, localStorage) and returns a normalized project.
export function parseProject(input) {
  let data = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch {
      fail(t('error.invalidJson'));
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(t('error.notAnObject'));
  if (!STEP_OPTIONS.includes(data.steps)) fail(t('error.invalidSteps', { options: STEP_OPTIONS.join(', ') }));
  if (typeof data.bpm !== 'number' || !Number.isFinite(data.bpm)) fail(t('error.invalidBpm'));
  if (!Array.isArray(data.channels)) fail(t('error.invalidChannels'));

  const channels = data.channels.map((c, i) => {
    const n = i + 1;
    if (!c || typeof c !== 'object') fail(t('error.channelNotObject', { n }));
    if (typeof c.sampleId !== 'string' || !c.sampleId) fail(t('error.channelNoSample', { n }));
    if (!Array.isArray(c.pattern)) fail(t('error.channelBadPattern', { n }));
    return {
      id: typeof c.id === 'string' && c.id ? c.id : makeId('c'),
      name: typeof c.name === 'string' && c.name.trim() ? c.name : c.sampleId,
      sampleId: c.sampleId,
      volume: clamp(Number(c.volume ?? DEFAULT_VOLUME) || 0, ...VOLUME_RANGE),
      pan: clamp(Number(c.pan ?? DEFAULT_PAN) || 0, ...PAN_RANGE),
      mute: Boolean(c.mute),
      solo: Boolean(c.solo),
      pattern: resizePattern(c.pattern.map((v) => (v ? 1 : 0)), data.steps),
    };
  });

  return {
    id: typeof data.id === 'string' && data.id ? data.id : makeId('p'),
    name: typeof data.name === 'string' && data.name.trim() ? data.name : DEFAULT_PROJECT_NAME,
    battleId: typeof data.battleId === 'string' ? data.battleId : null,
    bpm: clamp(Math.round(data.bpm), MIN_BPM, MAX_BPM),
    steps: data.steps,
    channels,
  };
}
