import { createProject, parseProject } from './project.js';

const KEY = 'ppap.project';

// The only place that knows where projects live; swap this file to move to a server.

function getStore() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadProject() {
  const store = getStore();
  const raw = store?.getItem(KEY);
  if (!raw) return { project: createProject(), error: null };
  try {
    return { project: parseProject(raw), error: null };
  } catch (e) {
    return { project: createProject(), error: `Сохранённый проект повреждён и был сброшен: ${e.message}` };
  }
}

export function saveProject(project) {
  const store = getStore();
  if (!store) return 'Браузер не даёт сохранять данные (приватный режим?). Используйте экспорт JSON.';
  try {
    store.setItem(KEY, JSON.stringify(project));
    return null;
  } catch {
    return 'Не удалось сохранить проект: хранилище браузера переполнено.';
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFileName(name) {
  return String(name).replace(/[^\p{L}\p{N}_ -]+/gu, '').trim() || 'project';
}

export function exportProject(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFileName(project.name)}.ppap.json`);
}

export async function importProject(file) {
  if (file.size > 1024 * 1024) throw new Error('Файл слишком большой для проекта (больше 1 МБ).');
  return parseProject(await file.text());
}
