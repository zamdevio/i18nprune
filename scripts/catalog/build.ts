import type { TranslateTargetLanguage } from '@i18nprune/core/types';
import { normalizeLanguageCode } from '@i18nprune/core/shared/languages/normalize.js';

export type GeneratedLanguageRow = TranslateTargetLanguage;

function canonicalTag(lower: string): string {
  try {
    return Intl.getCanonicalLocales(lower)[0] ?? lower;
  } catch {
    return lower;
  }
}

export function buildLanguageRow(rawCode: string): GeneratedLanguageRow {
  const code = normalizeLanguageCode(rawCode);
  const canon = canonicalTag(code);
  const en = new Intl.DisplayNames(['en'], { type: 'language' });
  const english = en.of(canon) ?? code;
  let native: string;
  try {
    const nat = new Intl.DisplayNames([canon], { type: 'language' });
    native = nat.of(canon) ?? english;
  } catch {
    native = english;
  }
  const base = (canon.split('-')[0] ?? canon).toLowerCase();
  const rtlBases = new Set(['ar', 'arc', 'ckb', 'dv', 'fa', 'ff', 'ha', 'he', 'khw', 'ks', 'ps', 'sd', 'ug', 'ur', 'yi']);
  const direction: TranslateTargetLanguage['direction'] = rtlBases.has(base) ? 'rtl' : 'ltr';
  return { code, english, native, direction };
}

export function buildGeneratedLanguageCatalog(inputCodes: readonly string[]): GeneratedLanguageRow[] {
  const list = inputCodes.map(buildLanguageRow);
  list.sort((a, b) => a.code.localeCompare(b.code));
  return list;
}
