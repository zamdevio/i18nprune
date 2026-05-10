/**
 * Re-export the core translator fallback classifier so CLI callers stay on the same logic
 * as **`runTranslate`** / **`runGenerate`**.
 */

export {
  classifyProviderFailureOutcome,
  isRetryableProviderFailure,
  type ProviderAttemptOutcome,
} from '@i18nprune/core';
