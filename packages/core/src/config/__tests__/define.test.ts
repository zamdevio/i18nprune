import { describe, expect, it } from 'vitest';
import { ConfigValidationError, defineConfig, parseI18nPruneConfig } from '../index.js';

describe('defineConfig', () => {
  it('merges defaults without validating locales.source (CLI parse is the gate)', () => {
    const cfg = defineConfig({
      locales: { source: 'en.json', directory: 'locales' },
      src: 'src',
      functions: ['t'],
    });
    expect(cfg.locales.source).toBe('en.json');

    expect(() =>
      parseI18nPruneConfig({
        locales: { source: 'en.json', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      }),
    ).toThrow(ConfigValidationError);
  });
});
