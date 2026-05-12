import { ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE } from '../constants/issueCodes.js';
import { I18nPruneError } from '../errors/index.js';
import {
  buildLanguageCatalog,
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
  suggestCatalogCodesForInvalidInputFromCatalog,
} from './catalog/index.js';

const MAX_HINT = 5;

function catalog(): ReturnType<typeof buildLanguageCatalog> {
  return buildLanguageCatalog(generatedLanguageCatalog);
}

/**
 * Ensures a language code exists in the translation-target catalog (plain error text, no terminal styling).
 * Use from generate and other core flows; CLI may layer styled hints separately.
 */
export function assertSupportedTargetLanguageCode(code: string): void {
  const cat = catalog();
  if (getLanguageByCodeFromCatalog(cat, code)) return;
  const hints = suggestCatalogCodesForInvalidInputFromCatalog(cat, code, MAX_HINT);
  const hintStr =
    hints.length > 0 ? hints.join(', ') : 'run i18nprune languages for supported codes';
  throw new I18nPruneError(`Unsupported language code "${code}" — try: ${hintStr}`, 'USAGE', {
    issueCode: ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE,
  });
}
