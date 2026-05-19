import { describe, expect, it } from 'vitest';
import { resolveGenerateLocaleDisplay, resolveLocaleDirection } from '../resolveGenerateLocaleDisplay.js';

describe('resolveLocaleDirection', () => {
  it('uses catalog direction when present', () => {
    expect(resolveLocaleDirection('ar', 'rtl')).toBe('rtl');
    expect(resolveLocaleDirection('en', 'ltr')).toBe('ltr');
  });

  it('falls back to RTL heuristic for unknown catalog direction', () => {
    expect(resolveLocaleDirection('ar', undefined)).toBe('rtl');
    expect(resolveLocaleDirection('en', undefined)).toBe('ltr');
  });
});

describe('resolveGenerateLocaleDisplay', () => {
  it('fills labels and direction from catalog row', () => {
    const out = resolveGenerateLocaleDisplay('ja', {
      code: 'ja',
      english: 'Japanese',
      native: '日本語',
      direction: 'ltr',
    });
    expect(out).toEqual({
      englishName: 'Japanese',
      nativeName: '日本語',
      direction: 'ltr',
    });
  });

  it('falls back to target code when catalog row is missing', () => {
    const out = resolveGenerateLocaleDisplay('xx-unknown');
    expect(out.englishName).toBe('xx-unknown');
    expect(out.nativeName).toBe('xx-unknown');
    expect(out.direction).toBe('ltr');
  });
});
