/**
 * **Generate** engine — prompt helpers, translation walk, locale JSON normalization.
 * Subpath: `@i18nprune/core/generate` (see package `exports`). Root `@i18nprune/core` also re-exports.
 */
export { createCoreContext, translateContextFromCore } from './context.js';
export { runGenerate, resolveGenerateDirectionDefault } from './run.js';
export { normalizeGeneratePromptLang } from './promptLang.js';
export { buildTranslatedLocaleFromSourceLeaves, localeJsonHasKeyPath } from './buildTranslatedLocale.js';
export { translateAndNormalizeGenerateLocale } from './translateAndNormalize.js';
export {
  TranslateRunInterruptedError,
  type TranslateRunPartialStats,
} from './translateRunInterruptedError.js';
export type {
  CoreContext,
  CoreResolvedPaths,
  GenerateHostHooks,
  GenerateJsonPayload,
  GenerateRunOptions,
  GenerateRunResult,
  GenerateTargetJsonRow,
  GenerateTargetProgressSummary,
} from '../types/generate/generateRun.js';
