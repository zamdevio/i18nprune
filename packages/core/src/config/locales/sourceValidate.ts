import {
  ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE,
  ISSUE_PROJECT_LOCALES_SOURCE_NOT_IN_BUNDLE,
  ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE,
} from '../../shared/constants/issueCodes.js';
import {
  buildLanguageCatalog,
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
  suggestCatalogCodesForInvalidInputFromCatalog,
} from '../../shared/languages/catalog/index.js';
import { normalizeLanguageCode } from '../../shared/languages/normalize.js';

const MAX_CATALOG_HINT = 5;

const LANGUAGE_CODE_SHAPE = /^[a-z]{2}(-[a-z0-9]{2,8})*$/i;

export type LocalesSourceInputKind = 'language_code' | 'path' | 'json_filename' | 'invalid_shape';

export type LocalesSourceValidationResult =
  | { ok: true; code: string }
  | { ok: false; issueCode: string; message: string };

function catalog() {
  return buildLanguageCatalog(generatedLanguageCatalog);
}

/** Classify raw `locales.source` before catalog / bundle checks. */
export function classifyLocalesSourceInput(raw: string): LocalesSourceInputKind {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return 'invalid_shape';
  if (trimmed.includes('/') || trimmed.includes('\\')) return 'path';
  if (trimmed.toLowerCase().endsWith('.json')) return 'json_filename';
  if (!LANGUAGE_CODE_SHAPE.test(trimmed)) return 'invalid_shape';
  return 'language_code';
}

function catalogHintLine(code: string): string | null {
  const hints = suggestCatalogCodesForInvalidInputFromCatalog(catalog(), code, MAX_CATALOG_HINT);
  return hints.length > 0 ? hints.join(', ') : null;
}

function localesSourceFieldMessage(raw: string, detail: string): string {
  return `locales.source is ${JSON.stringify(raw)} in your config — ${detail}`;
}

function unsupportedLanguageCodeFailure(code: string, raw: string): LocalesSourceValidationResult {
  const hint = catalogHintLine(code);
  if (hint === null) {
    return {
      ok: false,
      issueCode: ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE,
      message: localesSourceFieldMessage(
        raw,
        `"${code}" is not a supported language code. Set a BCP47 tag only (e.g. en, pt-br), not a file path or *.json. Run i18nprune languages for the full catalog.`,
      ),
    };
  }
  return {
    ok: false,
    issueCode: ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE,
    message: localesSourceFieldMessage(
      raw,
      `"${code}" is not a supported language code — try: ${hint}. Set a BCP47 tag only (not a path or *.json). Run i18nprune languages for the full list.`,
    ),
  };
}

function rejectNotLanguageCode(raw: string, detail: string): LocalesSourceValidationResult {
  return {
    ok: false,
    issueCode: ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE,
    message: localesSourceFieldMessage(raw, detail),
  };
}

/**
 * Validate `locales.source` is a supported language code (not a path or `*.json` basename).
 * Used at config parse, CLI normalize, and readiness.
 */
export function validateLocalesSourceConfigValue(raw: string): LocalesSourceValidationResult {
  const trimmed = raw.trim();
  const kind = classifyLocalesSourceInput(trimmed);
  if (kind === 'path') {
    const tail = trimmed.replace(/\\/g, '/').split('/').pop() ?? trimmed;
    if (tail.toLowerCase().endsWith('.json')) {
      const guess = normalizeLanguageCode(tail.replace(/\.json$/i, ''));
      if (!getLanguageByCodeFromCatalog(catalog(), guess)) {
        return unsupportedLanguageCodeFailure(guess, trimmed);
      }
      return rejectNotLanguageCode(
        trimmed,
        `use the language code "${guess}" instead of a file path (paths belong in locales.directory / layout, not locales.source).`,
      );
    }
    return rejectNotLanguageCode(
      trimmed,
      'must be a BCP47 language code (e.g. en, pt-br), not a file path — remove directory segments and use only the locale tag.',
    );
  }
  if (kind === 'json_filename') {
    const guess = normalizeLanguageCode(trimmed.replace(/\.json$/i, ''));
    if (getLanguageByCodeFromCatalog(catalog(), guess)) {
      return rejectNotLanguageCode(
        trimmed,
        `use the language code "${guess}" instead of the filename "${trimmed}" (locales.source is the tag only; JSON paths come from locales.directory and layout).`,
      );
    }
    const hinted = unsupportedLanguageCodeFailure(guess, trimmed);
    if (!hinted.ok && hinted.issueCode === ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE) {
      return hinted;
    }
    return rejectNotLanguageCode(
      trimmed,
      `use a supported language code instead of "${trimmed}". Run i18nprune languages for supported tags.`,
    );
  }
  if (kind === 'invalid_shape') {
    const candidate = normalizeLanguageCode(trimmed);
    const hinted = unsupportedLanguageCodeFailure(candidate, trimmed);
    if (!hinted.ok && hinted.issueCode === ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE) {
      return hinted;
    }
    return rejectNotLanguageCode(
      trimmed,
      'is not a valid language code shape. Use a BCP47 tag (e.g. en, pt-br). Run i18nprune languages for supported codes.',
    );
  }

  const code = normalizeLanguageCode(trimmed);
  if (!getLanguageByCodeFromCatalog(catalog(), code)) {
    return unsupportedLanguageCodeFailure(code, trimmed);
  }

  return { ok: true, code };
}

/** Readiness: configured source code has no matching locale segments under `locales.directory`. */
export function issueLocalesSourceNotInBundle(input: {
  sourceCode: string;
  directory: string;
  presentCodes: readonly string[];
}): { issueCode: string; message: string } {
  const present =
    input.presentCodes.length > 0
      ? input.presentCodes.map((c) => normalizeLanguageCode(c)).join(', ')
      : '(none discovered)';
  return {
    issueCode: ISSUE_PROJECT_LOCALES_SOURCE_NOT_IN_BUNDLE,
    message: `locales.source is "${input.sourceCode}" but no locale JSON segments for that code were found under ${input.directory}. Locales on disk: ${present}.`,
  };
}
