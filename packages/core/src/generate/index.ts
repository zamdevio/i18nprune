/**
 * **Generate** engine — prompt helpers, translation walk, locale JSON normalization.
 * Subpath: `@i18nprune/core/generate` (see package `exports`). Root `@i18nprune/core` also re-exports.
 */
export { normalizeGeneratePromptLang } from './promptLang.js';
export { buildTranslatedLocaleFromSourceLeaves, localeJsonHasKeyPath } from './buildTranslatedLocale.js';
export { translateAndNormalizeGenerateLocale } from './translateAndNormalize.js';
export {
  TranslateRunInterruptedError,
  type TranslateRunPartialStats,
} from './translateRunInterruptedError.js';
