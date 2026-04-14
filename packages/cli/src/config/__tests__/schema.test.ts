import { describe, it, expect } from 'vitest';
import { parseI18nPruneConfig, ConfigValidationError } from '@/config/schema.js';

describe('parseI18nPruneConfig', () => {
  it('parses minimal valid config', () => {
    const c = parseI18nPruneConfig({
      source: 'locales/en.json',
      localesDir: 'locales',
      src: 'src',
      functions: ['t'],
    });
    expect(c.source).toBe('locales/en.json');
    expect(c.functions).toEqual(['t']);
  });

  it('accepts optional sourceLocaleCode', () => {
    const c = parseI18nPruneConfig({
      source: 'locales/en.json',
      localesDir: 'locales',
      src: 'src',
      functions: ['t'],
      sourceLocaleCode: 'en',
    });
    expect(c.sourceLocaleCode).toBe('en');
  });

  it('rejects empty functions', () => {
    expect(() =>
      parseI18nPruneConfig({
        source: 'a',
        localesDir: 'b',
        src: 'c',
        functions: [],
      }),
    ).toThrow(ConfigValidationError);
  });

  it('accepts optional reportFormat', () => {
    const c = parseI18nPruneConfig({
      source: 'locales/en.json',
      localesDir: 'locales',
      src: 'src',
      functions: ['t'],
      reportFormat: 'text',
    });
    expect(c.reportFormat).toBe('text');
  });

  it('accepts validate and missing command namespaces', () => {
    const c = parseI18nPruneConfig({
      source: 'locales/en.json',
      localesDir: 'locales',
      src: 'src',
      functions: ['t'],
      validate: {},
      missing: { displayDefaultTop: 25 },
    });
    expect(c.missing?.displayDefaultTop).toBe(25);
  });

  it('accepts reference namespace', () => {
    const c = parseI18nPruneConfig({
      source: 'locales/en.json',
      localesDir: 'locales',
      src: 'src',
      functions: ['t'],
      reference: {
        defaults: { uncertainKeyPolicy: 'protect', stringPresence: 'warn' },
        commands: { fill: { respectPreserve: false } },
      },
    });
    expect(c.reference?.defaults?.uncertainKeyPolicy).toBe('protect');
    expect(c.reference?.commands?.fill?.respectPreserve).toBe(false);
  });

  it('rejects unknown keys under missing (strict)', () => {
    expect(() =>
      parseI18nPruneConfig({
        source: 'locales/en.json',
        localesDir: 'locales',
        src: 'src',
        functions: ['t'],
        missing: { typo: 1 },
      } as unknown),
    ).toThrow(ConfigValidationError);
  });
});
