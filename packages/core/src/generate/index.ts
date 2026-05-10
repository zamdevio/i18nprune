/**
 * **Generate** engine — prompt helpers, translation walk, locale JSON normalization.
 * Subpath: `@i18nprune/core/generate` (see package `exports`). Root `@i18nprune/core` also re-exports.
 */
export { createCoreContext, translateContextFromCore } from './context.js';
export { runGenerate, resolveGenerateDirectionDefault } from './run.js';
export { buildTranslatedLocaleFromSourceLeaves, localeJsonHasKeyPath } from './buildTranslatedLocale.js';
export { translateAndNormalizeGenerateLocale } from './normalize.js';
// Translator-layer error / partial-stats type are re-exported from `@i18nprune/core` and the
// dedicated `@i18nprune/core/translator` subpath.
export { TranslateRunInterruptedError } from '../translator/errors/interrupted.js';
export type { TranslateRunPartialStats } from '../types/translator/runStats.js';
export type {
  CoreContext,
  CoreResolvedPaths,
  GenerateHostHooks,
  GenerateJsonPayload,
  GenerateRunHooks,
  GenerateRunOptions,
  GenerateRunResult,
  GenerateTargetJsonRow,
  GenerateTargetProgressSummary,
  HandoffEligibilityRow,
  HandoffOffer,
  IncompleteRunDecision,
  IncompleteRunInfo,
  IncompleteRunReason,
} from '../types/generate/index.js';
