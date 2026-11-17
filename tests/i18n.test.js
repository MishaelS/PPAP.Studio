import { afterEach, describe, expect, it } from 'vitest';
import { LANGUAGES, LOCALES, getLanguage, setLanguage, t } from '../src/frontend/i18n.js';
import { DEFAULT_LANGUAGE } from '../src/backend/constants.js';

afterEach(() => setLanguage(DEFAULT_LANGUAGE));

describe('i18n', () => {
  it('has the same keys in every locale', () => {
    const base = Object.keys(LOCALES[DEFAULT_LANGUAGE]).sort();
    for (const lang of LANGUAGES) {
      const keys = Object.keys(LOCALES[lang]).sort();
      expect(keys, `locale "${lang}" keys differ from "${DEFAULT_LANGUAGE}"`).toEqual(base);
    }
  });

  it('keeps the same placeholders in every translation', () => {
    const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort();
    for (const lang of LANGUAGES) {
      for (const [key, text] of Object.entries(LOCALES[lang])) {
        expect(placeholders(text), `${lang}: ${key}`).toEqual(placeholders(LOCALES[DEFAULT_LANGUAGE][key]));
      }
    }
  });

  it('translates and fills placeholders', () => {
    expect(getLanguage()).toBe(DEFAULT_LANGUAGE);
    expect(t('rack.step', { n: 3 })).toBe('Шаг 3');
    expect(setLanguage('en')).toBe(true);
    expect(t('rack.step', { n: 3 })).toBe('Step 3');
  });

  it('keeps unknown placeholders and returns missing keys as is', () => {
    expect(t('rack.step')).toBe('Шаг {n}');
    expect(t('no.such.key')).toBe('no.such.key');
  });

  it('ignores unknown languages', () => {
    expect(setLanguage('xx')).toBe(false);
    expect(getLanguage()).toBe(DEFAULT_LANGUAGE);
  });
});
