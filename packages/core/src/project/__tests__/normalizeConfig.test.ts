import { describe, expect, it } from 'vitest';
import { normalizeProjectConfig } from '../normalizeConfig.js';

describe('normalizeProjectConfig', () => {
  it('accepts nested locales config', () => {
    const out = normalizeProjectConfig({
      locales: { source: 'locales/en.json', directory: 'locales' },
      src: 'src',
      functions: ['t'],
    });
    expect(out).toMatchObject({
      source: 'locales/en.json',
      localesDir: 'locales',
      src: 'src',
      functions: ['t'],
    });
  });

  it('rejects flat legacy source/localesDir top-level keys', () => {
    expect(normalizeProjectConfig({ source: 'en.json', localesDir: 'locales', src: 'src', functions: ['t'] })).toBeNull();
  });
});
