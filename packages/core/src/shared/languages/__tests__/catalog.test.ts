import { describe, expect, it } from 'vitest';
import {
  buildLanguageCatalog,
  filterLanguageCatalog,
  getLanguageByCodeFromCatalog,
  suggestCatalogCodesForInvalidInputFromCatalog,
} from '../catalog/index.js';

const RAW = [
  { code: 'JA', english: 'Japanese', native: '日本語', direction: 'ltr' as const },
  { code: 'pt-BR', english: 'Brazilian Portuguese', native: 'português (Brasil)', direction: 'ltr' as const },
  { code: 'en', english: 'English', native: 'English', direction: 'ltr' as const },
] as const;

describe('language catalog helpers', () => {
  it('normalizes codes in buildLanguageCatalog', () => {
    const catalog = buildLanguageCatalog(RAW);
    expect(catalog.map((r) => r.code)).toEqual(['ja', 'pt-br', 'en']);
  });

  it('filters by substring', () => {
    const catalog = buildLanguageCatalog(RAW);
    const rows = filterLanguageCatalog(catalog, 'japan');
    expect(rows.some((x) => x.code === 'ja')).toBe(true);
  });

  it('gets language by code with normalization', () => {
    const catalog = buildLanguageCatalog(RAW);
    expect(getLanguageByCodeFromCatalog(catalog, 'PT_BR')?.english).toBe('Brazilian Portuguese');
  });

  it('suggests prefix matches for typo-like input', () => {
    const catalog = buildLanguageCatalog(RAW);
    const out = suggestCatalogCodesForInvalidInputFromCatalog(catalog, 'ptp');
    expect(out.some((c) => c.startsWith('pt'))).toBe(true);
  });
});
