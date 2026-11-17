import ru from '../../resources/locales/ru.json';
import en from '../../resources/locales/en.json';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../backend/constants.js';

export const LOCALES = { ru, en };
export const LANGUAGES = Object.keys(LOCALES);

function readStored() {
  try {
    return globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

let current = LOCALES[readStored()] ? readStored() : DEFAULT_LANGUAGE;

export function getLanguage() {
  return current;
}

export function setLanguage(lang) {
  if (!LOCALES[lang]) return false;
  current = lang;
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Language still switches for this session.
  }
  if (globalThis.document) document.documentElement.lang = lang;
  return true;
}

// Missing keys fall back to the default language, then to the key itself so gaps are visible.
export function t(key, params = {}) {
  const text = LOCALES[current][key] ?? LOCALES[DEFAULT_LANGUAGE][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}
