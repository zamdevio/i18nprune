export { classifyTranslateFailure, type TranslateFailureOutcome } from './classify.js';
export {
  classifyProviderFailureOutcome,
  isRetryableProviderFailure,
  type ProviderAttemptOutcome,
} from './fallback.js';
export {
  policyKeyForOutcome,
  resolveProviderActionFor,
  type ResolveProviderActionInput,
  type TranslatePolicyAction,
} from './resolver.js';
export {
  buildHandoffCatalogEligible,
  explainHandoffIneligibility,
  HANDOFF_PROVIDER_ORDER,
  HANDOFF_PUBLIC_LIBRE_TRANSLATE_ORIGIN,
  prioritizeProviderAfter,
  shouldOfferHandoffInteractivePrompt,
  shouldWarnAndAbortHandoffOnNonTty,
  synthesizeHandoffTranslationOptions,
  type HandoffCatalogBuildResult,
  type HandoffEligibilityRow,
} from './handoff.js';
