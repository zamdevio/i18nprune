export { classifyTranslateFailure } from './classify.js';
export type { TranslateFailureOutcome } from '../../types/translator/policyOutcomes.js';
export { classifyProviderFailureOutcome, isRetryableProviderFailure } from './fallback.js';
export type { ProviderAttemptOutcome } from '../../types/translator/policyOutcomes.js';
export { policyKeyForOutcome, resolveProviderActionFor } from './resolver.js';
export type { ResolveProviderActionInput, TranslatePolicyAction } from '../../types/translator/policyAction.js';
export {
  buildHandoffCatalogEligible,
  explainHandoffIneligibility,
  HANDOFF_PROVIDER_ORDER,
  HANDOFF_PUBLIC_LIBRE_TRANSLATE_ORIGIN,
  prioritizeProviderAfter,
  shouldOfferHandoffInteractivePrompt,
  shouldWarnAndAbortHandoffOnNonTty,
  synthesizeHandoffTranslationOptions,
} from './handoff.js';
export type { HandoffCatalogBuildResult, HandoffEligibilityRow } from '../../types/translator/handoff.js';
