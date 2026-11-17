// Shared constants and small helpers for the whole app. User-facing text lives in resources/locales.

export const APP_NAME = 'PPAP.Studio';

// Project
export const MIN_BPM = 40;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 140;
export const BPM_WHEEL_STEP = 1;
export const STEP_OPTIONS = [16, 32];
export const DEFAULT_STEPS = 16;
export const STEPS_PER_BEAT = 4;
export const STEPS_PER_GROUP = 4;
export const DEFAULT_PROJECT_NAME = 'Untitled';
export const DEFAULT_CHANNEL_NAME = 'Channel';
export const DEFAULT_SAMPLE = { id: 'kick', name: 'Kick' };
export const PROJECT_NAME_MAX = 60;
export const CHANNEL_NAME_MAX = 24;

// Channel
export const DEFAULT_VOLUME = 0.8;
export const DEFAULT_PAN = 0;
export const VOLUME_RANGE = [0, 1];
export const PAN_RANGE = [-1, 1];
export const KNOB_STEP = 0.01;

// Audio engine
export const SCHEDULE_LOOKAHEAD = 0.1;
export const SCHEDULER_TICK_MS = 25;
export const START_DELAY = 0.05;
export const MASTER_GAIN = 0.9;
export const PREVIEW_VOLUME = 0.9;
export const LIMITER_THRESHOLD_DB = -3;
export const LIMITER_RATIO = 12;
export const EXPORT_TAIL = 1.5;
export const EXPORT_LOOPS = 2;
export const NO_STEP = -1;

// Storage and files
export const STORAGE_KEY = 'ppap.project';
export const AUTOSAVE_DELAY_MS = 300;
export const MAX_IMPORT_BYTES = 1024 * 1024;
export const PROJECT_FILE_EXT = '.ppap.json';
export const WAV_FILE_EXT = '.wav';
export const DEFAULT_FILE_NAME = 'project';
export const OBJECT_URL_TTL_MS = 1000;

// Drag and drop
export const DRAG_SAMPLE_TYPE = 'application/x-ppap-sample';

// Language
export const DEFAULT_LANGUAGE = 'ru';
export const LANGUAGE_STORAGE_KEY = 'ppap.language';

// Keys
export const KEY_PLAY = 'Space';
export const TYPING_TAGS = ['INPUT', 'SELECT', 'TEXTAREA'];

// Helpers
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function percent(value) {
  return Math.round(value * 100);
}

// Joins truthy class names: cx('step', on && 'on') -> 'step on'.
export function cx(...names) {
  return names.filter(Boolean).join(' ');
}

export function safeFileName(name) {
  return String(name).replace(/[^\p{L}\p{N}_ -]+/gu, '').trim() || DEFAULT_FILE_NAME;
}

export function isTypingTarget(el) {
  return Boolean(el && (TYPING_TAGS.includes(el.tagName) || el.isContentEditable));
}
