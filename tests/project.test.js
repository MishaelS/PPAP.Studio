import { describe, expect, it } from 'vitest';
import * as P from '../src/frontend/project.js';
import { MAX_BPM, MIN_BPM } from '../src/backend/constants.js';

describe('project model', () => {
  it('creates a default project with matching pattern lengths', () => {
    const p = P.createProject();
    expect(p.steps).toBe(16);
    expect(p.channels.length).toBeGreaterThan(0);
    for (const c of p.channels) expect(c.pattern).toHaveLength(16);
  });

  it('toggles a step without mutating the original', () => {
    const p = P.createProject();
    const id = p.channels[3].id;
    const next = P.toggleStep(p, id, 5);
    expect(next.channels[3].pattern[5]).toBe(1);
    expect(p.channels[3].pattern[5]).toBe(0);
    expect(P.toggleStep(next, id, 5).channels[3].pattern[5]).toBe(0);
  });

  it('adds, renames, clears and removes channels', () => {
    let p = P.addChannel(P.createProject(), 'crash', 'Crash');
    const c = p.channels.at(-1);
    expect(c.sampleId).toBe('crash');
    expect(c.pattern).toHaveLength(p.steps);

    p = P.setChannel(p, c.id, { name: '  ' });
    expect(p.channels.at(-1).name).toBe('Channel');

    const kick = p.channels[0].id;
    p = P.clearChannel(p, kick);
    expect(p.channels[0].pattern.every((v) => v === 0)).toBe(true);

    p = P.removeChannel(p, c.id);
    expect(p.channels.find((x) => x.id === c.id)).toBeUndefined();
  });

  it('clamps volume, pan and bpm', () => {
    let p = P.createProject();
    const id = p.channels[0].id;
    p = P.setChannel(p, id, { volume: '5', pan: -3 });
    expect(p.channels[0].volume).toBe(1);
    expect(p.channels[0].pan).toBe(-1);
    expect(P.setBpm(p, 1000).bpm).toBe(MAX_BPM);
    expect(P.setBpm(p, 1).bpm).toBe(MIN_BPM);
    expect(P.setBpm(p, 'abc').bpm).toBe(p.bpm);
  });

  it('resizes patterns: grow repeats, shrink truncates', () => {
    const p = P.createProject();
    const grown = P.setSteps(p, 32);
    expect(grown.channels[0].pattern).toEqual([...p.channels[0].pattern, ...p.channels[0].pattern]);
    const back = P.setSteps(grown, 16);
    expect(back.channels[0].pattern).toEqual(p.channels[0].pattern);
    expect(P.setSteps(p, 7)).toBe(p);
  });

  it('computes 16th-note step duration', () => {
    expect(P.stepDuration(120)).toBeCloseTo(0.125);
    expect(P.stepDuration(60)).toBeCloseTo(0.25);
  });

  it('applies mute and solo rules', () => {
    const a = { solo: false, mute: false };
    const b = { solo: false, mute: true };
    expect(P.isAudible(a, [a, b])).toBe(true);
    expect(P.isAudible(b, [a, b])).toBe(false);
    const s = { solo: true, mute: true };
    expect(P.isAudible(s, [a, s])).toBe(true);
    expect(P.isAudible(a, [a, s])).toBe(false);
  });
});

describe('parseProject', () => {
  it('round-trips a valid project', () => {
    const p = P.createProject();
    expect(P.parseProject(JSON.stringify(p))).toEqual(p);
  });

  it('normalizes loose fields', () => {
    const p = P.parseProject({
      bpm: 999.4,
      steps: 16,
      channels: [{ sampleId: 'kick', pattern: [1, true, 0], volume: 'x' }],
    });
    expect(p.bpm).toBe(MAX_BPM);
    expect(p.name).toBe('Untitled');
    expect(p.channels[0].pattern).toHaveLength(16);
    expect(p.channels[0].pattern.slice(0, 3)).toEqual([1, 1, 0]);
    expect(p.channels[0].volume).toBe(0);
    expect(p.channels[0].name).toBe('kick');
  });

  it.each([
    ['{not json', 'корректным JSON'],
    ['[]', 'JSON-объектом'],
    [{ bpm: 120, steps: 12, channels: [] }, '"steps"'],
    [{ bpm: '120', steps: 16, channels: [] }, '"bpm"'],
    [{ bpm: 120, steps: 16 }, '"channels"'],
    [{ bpm: 120, steps: 16, channels: [{ pattern: [] }] }, 'Канал #1: нет поля "sampleId"'],
    [{ bpm: 120, steps: 16, channels: [{ sampleId: 'kick' }] }, 'Канал #1: поле "pattern"'],
  ])('rejects bad input with a clear message: %j', (input, message) => {
    expect(() => P.parseProject(input)).toThrow(P.ProjectError);
    expect(() => P.parseProject(input)).toThrow(message);
  });
});
