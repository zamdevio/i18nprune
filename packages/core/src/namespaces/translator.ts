export { localeJsonValueFromTranslation, translateLeaf, validateLeafTranslationString } from '../shared/translator/index.js';
export type {
  TranslationLeafMeta,
  TranslationLeafMetaPatch,
  TranslationProviderYield,
  TranslationResult,
} from '../types/translator/result.js';
export { createGoogleTranslator, parseGtxResponse } from '../shared/translator/providers/google/index.js';
export { createLlmTranslator, parseOpenAiChatCompletionContent } from '../shared/translator/providers/llm/index.js';
export {
  buildTranslationProvidersPayload,
  TRANSLATION_PROVIDER_CREDENTIAL_PRECEDENCE,
} from '../shared/translator/utils/helpPayload.js';
export type { TranslationProvidersListPayload } from '../shared/translator/utils/helpPayload.js';
export {
  defaultResolvedTranslationOptions,
  isTranslationProviderId,
  listTranslationProviders,
  resolveTranslator,
  translationRunMeta,
  validateResolvedTranslationOptions,
} from '../shared/translator/providers/registry.js';
export {
  DEFAULT_PROVIDER_RATE_LIMITS,
  mapWithConcurrency,
  resolveTranslateMaxParallel,
  TRANSLATE_WORKERS_CAP,
} from '../shared/translator/utils/orchestration.js';
export type { ResolveTranslateMaxParallelInput, TranslateLeafJob, TranslateOrchestrationLimits } from '../shared/translator/utils/orchestration.js';
export type { ProviderRateLimitProfile, ProviderRateLimitRegistry, TranslateStartRateLimit } from '../types/translator/rateLimit.js';
export {
  buildIdentityStreakIssue,
  createIdentityStreakGuard,
  IDENTITY_STREAK_SAMPLE_MAX,
  IDENTITY_STREAK_THRESHOLD,
  IdentityAbortError,
  isIdentityTranslation,
  nextIdentityStreakState,
} from '../translator/identity/index.js';
export type {
  IdentitySample,
  IdentityStreakConfirmFn,
  IdentityStreakConfirmInput,
  IdentityStreakGuard,
  IdentityStreakGuardOptions,
  IdentityStreakInteractive,
  IdentityStreakState,
} from '../translator/identity/index.js';

export {
  ENV_TRANSLATE_DEEPL_API_KEY,
  ENV_TRANSLATE_LIBRE_URL,
  ENV_TRANSLATE_LLM_API_KEY,
  ENV_TRANSLATE_LLM_BASE_URL,
  ENV_TRANSLATE_LLM_MODEL,
  ENV_TRANSLATE_MAX_WORKERS,
  ENV_TRANSLATE_PROVIDER,
} from '../shared/constants/translate.js';
export type { TranslatorEnv } from '../shared/constants/translate.js';

export {
  assertTranslationProviderCredentialsReady,
  effectiveTranslationProviderId,
  resolvedTranslationOptionsFromCliFlag,
  resolveTranslationProviderOptions,
  resolveTranslationProviderOptionsForId,
  resolveTranslationProviderOrder,
} from '../translator/providers/index.js';

export {
  classifyProviderFailureOutcome,
  classifyTranslateFailure,
  isRetryableProviderFailure,
  type ProviderAttemptOutcome,
  type TranslateFailureOutcome,
} from '../translator/policy/index.js';

export {
  buildTranslateParallelLimitSuggestion,
  resolveProviderRateLimitProfile,
  resolveTranslateMaxParallelEffective,
  resolveTranslateMaxParallelFromConfig,
  resolveTranslateRateLimitEffective,
} from '../translator/limits/index.js';

export type {
  ProviderAttemptReport,
  TranslateHooks,
  TranslateIdentityGuardOptions,
  TranslateLeafInput,
  TranslateOptions,
  TranslateOutput,
  TranslateResultItem,
  TranslateRunPartialStats,
} from '../types/translator/translate.js';

export { runTranslate } from '../translator/run.js';
export { createTranslateContext, type TranslateContext } from '../translator/context.js';
