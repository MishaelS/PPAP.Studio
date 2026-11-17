import { createProject, parseProject } from './project.js';
import {
  MAX_IMPORT_BYTES, OBJECT_URL_TTL_MS, PROJECT_FILE_EXT, STORAGE_KEY, safeFileName,
} from '../backend/constants.js';
import { t } from './i18n.js';

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
  const raw = store?.getItem(STORAGE_KEY);
  if (!raw) return { project: createProject(), error: null };
  try {
    return { project: parseProject(raw), error: null };
  } catch (e) {
    return { project: createProject(), error: t('error.savedProjectBroken', { reason: e.message }) };
  }
}

export function saveProject(project) {
  const store = getStore();
  if (!store) return t('error.storageUnavailable');
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(project));
    return null;
  } catch {
    return t('error.storageFull');
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_TTL_MS);
}

export function exportProject(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFileName(project.name)}${PROJECT_FILE_EXT}`);
}

export async function importProject(file) {
  if (file.size > MAX_IMPORT_BYTES) throw new Error(t('error.importTooLarge', { mb: MAX_IMPORT_BYTES / 1024 / 1024 }));
  return parseProject(await file.text());
}
