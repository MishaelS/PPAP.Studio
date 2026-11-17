import { afterEach, describe, expect, it, vi } from 'vitest';
import { importProject, loadProject, saveProject } from '../src/frontend/storage.js';
import { safeFileName } from '../src/backend/constants.js';
import { createProject } from '../src/frontend/project.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => { data[k] = v; },
    data,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('storage', () => {
  it('returns a fresh project when nothing is saved', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    const { project, error } = loadProject();
    expect(error).toBeNull();
    expect(project.channels.length).toBeGreaterThan(0);
  });

  it('saves and loads the same project', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    const p = { ...createProject(), name: 'Saved' };
    expect(saveProject(p)).toBeNull();
    expect(loadProject().project).toEqual(p);
  });

  it('recovers from a corrupted save with a message instead of crashing', () => {
    vi.stubGlobal('localStorage', fakeStorage({ 'ppap.project': '{broken' }));
    const { project, error } = loadProject();
    expect(project.steps).toBe(16);
    expect(error).toMatch(/повреждён/);
  });

  it('reports a full storage as a readable error', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
    });
    expect(saveProject(createProject())).toMatch(/переполнено/);
  });

  it('imports a project file and rejects oversized or invalid files', async () => {
    const p = createProject();
    const ok = new Blob([JSON.stringify(p)]);
    await expect(importProject(ok)).resolves.toEqual(p);
    await expect(importProject(new Blob(['nope']))).rejects.toThrow(/JSON/);
    await expect(importProject({ size: 5 * 1024 * 1024, text: async () => '' })).rejects.toThrow(/слишком большой/);
  });

  it('makes safe file names', () => {
    expect(safeFileName('My beat: v2/final?')).toBe('My beat v2final');
    expect(safeFileName('???')).toBe('project');
    expect(safeFileName('Бит 1')).toBe('Бит 1');
  });
});
