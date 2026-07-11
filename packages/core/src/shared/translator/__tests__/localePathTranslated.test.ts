import { describe, expect, it } from 'vitest';
import { localePathLooksTranslatedFromSource } from '../localePathTranslated.js';

describe('localePathLooksTranslatedFromSource', () => {
  it('returns false when target still has placeholder sentinel leaks', () => {
    const localeJson = { meta: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __' };
    expect(localePathLooksTranslatedFromSource(localeJson, 'meta', '{{who}} · {{status}}')).toBe(false);
  });

  it('returns true for a non-leak translated string', () => {
    const localeJson = { meta: 'مرحبا · نشط' };
    expect(localePathLooksTranslatedFromSource(localeJson, 'meta', '{{who}} · {{status}}')).toBe(true);
  });
});
