import { describe, expect, it } from 'vitest';
import * as C from '../src/backend/constants.js';

describe('constants helpers', () => {
  it('clamps values', () => {
    expect(C.clamp(5, 0, 1)).toBe(1);
    expect(C.clamp(-5, 0, 1)).toBe(0);
    expect(C.clamp(0.3, 0, 1)).toBe(0.3);
  });

  it('makes prefixed unique ids', () => {
    const a = C.makeId('c');
    expect(a).toMatch(/^c_[a-z0-9]+$/);
    expect(C.makeId('c')).not.toBe(a);
  });

  it('joins class names skipping falsy values', () => {
    expect(C.cx('step', false, 0, null, 'on', undefined, '')).toBe('step on');
  });

  it('converts to percent', () => {
    expect(C.percent(0.8)).toBe(80);
    expect(C.percent(-0.255)).toBe(-25);
  });

  it('detects typing targets', () => {
    expect(C.isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(C.isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(C.isTypingTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(C.isTypingTarget(null)).toBe(false);
  });

  it('keeps default values consistent', () => {
    expect(C.STEP_OPTIONS).toContain(C.DEFAULT_STEPS);
    expect(C.DEFAULT_BPM).toBeGreaterThanOrEqual(C.MIN_BPM);
    expect(C.DEFAULT_BPM).toBeLessThanOrEqual(C.MAX_BPM);
    expect(C.DEFAULT_LANGUAGE).toBe('ru');
  });
});
