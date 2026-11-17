import { describe, expect, it } from 'vitest';
import { channelsForStep, scheduleWindow } from '../src/frontend/audio.js';
import { createProject, setChannel } from '../src/frontend/project.js';
import { SAMPLES, findSample, sampleGroups } from '../src/frontend/samples.js';
import { encodeWav } from '../src/frontend/wav.js';

describe('scheduler', () => {
  it('schedules every step inside the lookahead window', () => {
    const win = scheduleWindow({ nextTime: 1, step: 0, until: 1.5, bpm: 120, steps: 16 });
    expect(win.hits.map((h) => h.step)).toEqual([0, 1, 2, 3]);
    expect(win.hits[1].time).toBeCloseTo(1.125);
    expect(win.nextTime).toBeCloseTo(1.5);
    expect(win.step).toBe(4);
  });

  it('wraps around the end of the pattern', () => {
    const win = scheduleWindow({ nextTime: 0, step: 15, until: 0.3, bpm: 120, steps: 16 });
    expect(win.hits.map((h) => h.step)).toEqual([15, 0, 1]);
  });

  it('keeps step in range after the pattern shrinks', () => {
    const win = scheduleWindow({ nextTime: 0, step: 20, until: 0.1, bpm: 120, steps: 16 });
    expect(win.hits[0].step).toBe(4);
  });

  it('returns nothing when the window is already covered', () => {
    expect(scheduleWindow({ nextTime: 2, step: 3, until: 1, bpm: 120, steps: 16 }).hits).toEqual([]);
  });

  it('plays only audible channels with an active step', () => {
    let p = createProject();
    expect(channelsForStep(p, 4).map((c) => c.name)).toEqual(['Kick', 'Clap']);
    p = setChannel(p, p.channels[0].id, { mute: true });
    expect(channelsForStep(p, 4).map((c) => c.name)).toEqual(['Clap']);
    p = setChannel(p, p.channels[2].id, { solo: true });
    expect(channelsForStep(p, 4)).toEqual([]);
    expect(channelsForStep(p, 2).map((c) => c.name)).toEqual(['Hat']);
  });
});

describe('samples', () => {
  it('has unique ids and every default channel sample exists', () => {
    const ids = SAMPLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of createProject().channels) expect(findSample(c.sampleId)).not.toBeNull();
    expect(sampleGroups().flatMap(([, list]) => list)).toHaveLength(SAMPLES.length);
  });
});

describe('wav encoder', () => {
  it('writes a valid 16-bit stereo header and clipped samples', async () => {
    const left = new Float32Array([0, 1, -1, 2]);
    const right = new Float32Array([0.5, -0.5, 0, -2]);
    const blob = encodeWav({
      numberOfChannels: 2, sampleRate: 44100, length: 4, getChannelData: (c) => (c ? right : left),
    });
    const view = new DataView(await blob.arrayBuffer());
    const str = (o) => String.fromCharCode(...new Uint8Array(view.buffer, o, 4));
    expect(str(0)).toBe('RIFF');
    expect(str(8)).toBe('WAVE');
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint32(40, true)).toBe(16);
    expect(blob.size).toBe(44 + 16);
    expect(view.getInt16(44 + 2 * 2, true)).toBe(0x7fff);
    expect(view.getInt16(44 + 3 * 4 + 2, true)).toBe(-0x8000);
  });
});
