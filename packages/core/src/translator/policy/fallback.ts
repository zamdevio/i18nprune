/**
 * Provider-fallback decision helpers used by the translator's per-provider chain.
 *
 * Inspect the **structured `issues`** that **`translateLeaf`** attaches to a normalized
 * **`I18nPruneError`** and decide whether the next provider should be tried.
 */

import {
  ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR,
  ISSUE_GENERATE_TRANSLATE_RATE_LIMITED,
} from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';

function getIssues(err: unknown): Issue[] {
  const maybe = err as { issues?: unknown } | undefined;
  return Array.isArray(maybe?.issues) ? (maybe.issues as Issue[]) : [];
}

/** Retryable translation backend failures for provider fallback. */
export function isRetryableProviderFailure(err: unknown): boolean {
  const codes = new Set(getIssues(err).map((i) => i.code));
  return codes.has(ISSUE_GENERATE_TRANSLATE_RATE_LIMITED) || codes.has(ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR);
}

export type ProviderAttemptOutcome =
  | 'success'
  | 'rate_limited'
  | 'network_error'
  | 'non_retryable_error';

export function classifyProviderFailureOutcome(err: unknown): ProviderAttemptOutcome {
  const codes = new Set(getIssues(err).map((i) => i.code));
  if (codes.has(ISSUE_GENERATE_TRANSLATE_RATE_LIMITED)) return 'rate_limited';
  if (codes.has(ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR)) return 'network_error';
  return 'non_retryable_error';
}
