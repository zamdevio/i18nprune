import { isErrnoCode } from '../../shared/errors/index.js';

export type TranslateFailureOutcome =
  | 'rate_limited'
  | 'quota_exceeded'
  | 'transient_network'
  | 'provider_unavailable'
  | 'auth_failure'
  | 'malformed_response'
  | 'unknown_hard_stop';

/**
 * Internal outcome classifier for provider failures.
 * This powers translate-policy routing decisions without changing provider adapters.
 */
export function classifyTranslateFailure(err: unknown): TranslateFailureOutcome {
  const msg = err instanceof Error ? err.message : String(err);

  if (/\b429\b/.test(msg) || /\btoo many requests\b/i.test(msg)) {
    if (/MYMEMORY WARNING:\s*YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY/i.test(msg)) {
      return 'quota_exceeded';
    }
    return 'rate_limited';
  }

  if (/\b401\b/.test(msg) || /\b403\b/.test(msg) || /\bunauthorized\b/i.test(msg) || /\bforbidden\b/i.test(msg)) {
    return 'auth_failure';
  }

  if (
    isErrnoCode(err, 'ECONNRESET') ||
    isErrnoCode(err, 'ETIMEDOUT') ||
    isErrnoCode(err, 'ENOTFOUND') ||
    isErrnoCode(err, 'EAI_AGAIN') ||
    isErrnoCode(err, 'ECONNREFUSED') ||
    /fetch failed/i.test(msg) ||
    /network/i.test(msg)
  ) {
    return 'transient_network';
  }

  if (/\b5\d{2}\b/.test(msg) || /\bservice unavailable\b/i.test(msg)) {
    return 'provider_unavailable';
  }

  if (/invalid json/i.test(msg) || /malformed/i.test(msg) || /unexpected token/i.test(msg)) {
    return 'malformed_response';
  }

  return 'unknown_hard_stop';
}
