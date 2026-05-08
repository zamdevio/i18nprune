import { describe, it, expect } from 'vitest';
import { languageOftenRtl } from '../rtlHint.js';
import { normalizeLanguageCode } from '../normalize.js';

describe('core language helpers', () => {
  it('normalizes code', () => {
    expect(normalizeLanguageCode('  PT_BR ')).toBe('pt-br');
  });

  it('returns true for common RTL codes', () => {
    expect(languageOftenRtl('ar')).toBe(true);
    expect(languageOftenRtl('he')).toBe(true);
    expect(languageOftenRtl('fa-IR')).toBe(true);
  });

  it('returns false for typical LTR codes', () => {
    expect(languageOftenRtl('en')).toBe(false);
    expect(languageOftenRtl('ja')).toBe(false);
    expect(languageOftenRtl('pt-br')).toBe(false);
  });
});
