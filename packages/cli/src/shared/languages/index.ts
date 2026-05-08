import { I18nPruneError, ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE } from '@i18nprune/core';
import type { TranslateTargetLanguage } from '@/types/core/languages/catalog.js';
import { style } from '@/utils/style/index.js';
import {
  buildLanguageCatalog,
  filterLanguageCatalog,
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
  normalizeLanguageCode,
  suggestCatalogCodesForInvalidInputFromCatalog,
} from '@i18nprune/core';

const MAX_CODES_IN_CATALOG_HINT = 5;

export type { TranslateTargetLanguage };
export { normalizeLanguageCode };

let cached: readonly TranslateTargetLanguage[] | null = null;

function loadCatalog(): readonly TranslateTargetLanguage[] {
  if (cached) return cached;
  cached = buildLanguageCatalog(generatedLanguageCatalog);
  return cached;
}

/** Case-insensitive substring match on code, English, or native name. */
export function filterLanguages(filter: string | undefined): TranslateTargetLanguage[] {
  return filterLanguageCatalog(loadCatalog(), filter);
}

export function getLanguageByCode(code: string): TranslateTargetLanguage | undefined {
  return getLanguageByCodeFromCatalog(loadCatalog(), code);
}

/**
 * Suggest catalog codes for an unknown input: substring match (see {@link filterLanguages}), then
 * codes sharing the first two characters, then alphabetical fill — up to {@link MAX_CODES_IN_CATALOG_HINT}.
 */
export function suggestCatalogCodesForInvalidInput(code: string): string[] {
  return suggestCatalogCodesForInvalidInputFromCatalog(loadCatalog(), code, MAX_CODES_IN_CATALOG_HINT);
}

/** Styled hint line (codes + “(+N more)” + `i18nprune languages`) — same policy as `formatLocaleSlugHint`. */
export function formatCatalogLanguageHint(invalidCode: string): string {
  const suggested = suggestCatalogCodesForInvalidInput(invalidCode);
  const total = loadCatalog().length;
  if (suggested.length === 0 || total === 0) {
    return `${style.dim(`Run ${style.reset(style.accent('i18nprune languages'))} ${style.dim('for supported codes.')}`)}`;
  }
  const shown = suggested.slice(0, MAX_CODES_IN_CATALOG_HINT);
  const shownStr = shown.join(', ');
  if (total <= MAX_CODES_IN_CATALOG_HINT) {
    return `${shownStr}. ${style.dim(`Run ${style.reset(style.accent('i18nprune languages'))} ${style.dim('for the full list.')}`)}`;
  }
  const more = total - shown.length;
  return `${shownStr} ${style.dim(`(+${String(more)} more)`)}. ${style.dim(`Run ${style.reset(style.accent('i18nprune languages'))} ${style.dim('for the full list.')}`)}`;
}

export function validateTargetLanguageCode(code: string): void {
  if (!getLanguageByCode(code)) {
    throw new I18nPruneError(
      `Unsupported language code "${code}" — try: ${formatCatalogLanguageHint(code)}`,
      'USAGE',
      { issueCode: ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE },
    );
  }
}
