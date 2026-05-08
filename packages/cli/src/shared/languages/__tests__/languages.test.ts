import { describe, it, expect } from 'vitest';
import {
  filterLanguages,
  normalizeLanguageCode,
  getLanguageByCode,
  validateTargetLanguageCode,
  suggestCatalogCodesForInvalidInput,
} from '@/shared/languages/index.js';
import { I18nPruneError } from '@i18nprune/core';

describe('languages', () => {
  it('normalizes code', () => {
    expect(normalizeLanguageCode('  PT_BR ')).toBe('pt-br');
  });

  it('filters by substring', () => {
    const r = filterLanguages('japan');
    expect(r.some((x) => x.code === 'ja')).toBe(true);
  });

  it('getLanguageByCode', () => {
    expect(getLanguageByCode('JA')?.english).toBe('Japanese');
  });

  it('validateTargetLanguageCode throws for unknown', () => {
    expect(() => validateTargetLanguageCode('zzz-unknown')).toThrow(I18nPruneError);
  });

  it('validateTargetLanguageCode message mentions i18nprune languages', () => {
    expect(() => validateTargetLanguageCode('not-a-real-locale-xx')).toThrow(
      /i18nprune languages/i,
    );
  });

  it('validateTargetLanguageCode accepts normalized code', () => {
    expect(() => validateTargetLanguageCode('JA')).not.toThrow();
  });

  it('suggestCatalogCodesForInvalidInput prefers prefix matches for typos like ptp', () => {
    const s = suggestCatalogCodesForInvalidInput('ptp');
    expect(s.length).toBeGreaterThan(0);
    expect(s.some((c) => c.startsWith('pt'))).toBe(true);
  });
});
