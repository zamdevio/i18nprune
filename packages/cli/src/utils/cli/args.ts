import {
  ALL_LOCALES_TOKEN,
  isAllLocaleToken,
  parseSyncLangSelection as parseSyncLangSelectionFromCore,
  parseLocaleCodesList as parseLocaleCodesListFromCore,
  pickTargetSelector as pickTargetSelectorFromCore,
} from '@i18nprune/core';

export const ALL_LANG_TOKEN = ALL_LOCALES_TOKEN;

/** Comma-separated locale basenames, or **`all`** (case-insensitive). */
export function parseLocaleCodesList(raw: string): string[] {
  return parseLocaleCodesListFromCore(raw);
}

export function isAllLangToken(raw: string): boolean {
  return isAllLocaleToken(raw);
}

/**
 * **`sync`**: omit → all non-source locales; **`all`** → same; else comma-separated codes.
 */
export function parseSyncLangSelection(
  lang: string | undefined,
): { mode: 'all' } | { mode: 'codes'; codes: string[] } {
  return parseSyncLangSelectionFromCore(lang);
}

/** Normalized target selector (single value, list, or `all`). */
export function pickTargetSelector(target?: string): string | undefined {
  return pickTargetSelectorFromCore(target);
}
