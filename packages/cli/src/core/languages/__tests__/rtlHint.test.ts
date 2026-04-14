import { describe, it, expect } from 'vitest';
import { languageOftenRtl } from '@/core/languages/rtlHint.js';

describe('languageOftenRtl', () => {
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
