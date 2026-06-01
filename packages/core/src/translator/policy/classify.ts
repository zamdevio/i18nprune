import { isErrnoCode } from '../../shared/errors/index.js';
import type { TranslateFailureOutcome } from '../../types/translator/policyOutcomes.js';

/**
 * Canonical outcome taxonomy for a **single** failed provider attempt.
 *
 * This is the **input alphabet** the translate-policy resolver (step 5) will route on.
 * It is intentionally finer-grained than the legacy two-issue split (`rate_limited` /
 * `network_error`) so policy decisions can distinguish, for example, a recoverable 429
 * from a hard daily-quota wall, or a transient socket reset from a sustained 5xx.
 *
 * Variants:
 * - `rate_limited` — HTTP 429 / "too many requests" without a hard-quota signal.
 *   Eligible for backoff retry on the **same** provider.
 * - `quota_exceeded` — provider explicitly says today's free quota is gone (e.g. MyMemory
 *   "USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY"). Same provider is dead until the
 *   quota window resets; chain should advance.
 * - `transient_network` — TCP/DNS-level glitch (`ECONNRESET`, `ETIMEDOUT`, `EAI_AGAIN`,
 *   `ENOTFOUND`, `ECONNREFUSED`, "fetch failed", generic /network/). Retry-friendly.
 * - `provider_unavailable` — HTTP 5xx / "service unavailable". The endpoint reachable but
 *   degraded. Retry-friendly with backoff; long-running 5xx may trip the health monitor
 *   in step 3.
 * - `auth_failure` — HTTP 401 / 403 / "unauthorized" / "forbidden". Configuration-level;
 *   never auto-retry.
 * - `malformed_response` — provider returned syntactically broken payload (non-JSON,
 *   "unexpected token", "malformed"). Treated as terminal for that provider; chain may
 *   advance per policy.
 * - `unknown_hard_stop` — anything we cannot confidently slot. Conservative default:
 *   non-retryable on the same provider.
 *
 * @remarks
 * The enum represents **failure** outcomes only. A successful translation never reaches
 * this classifier. The success path is encoded by the `TranslationResult.decision`
 * field at the call boundary.
 */

/**
 * Map a thrown error from a single provider attempt to a {@link TranslateFailureOutcome}.
 *
 * **Pure** — no I/O, no time, no host adapters. Safe to call from any runtime.
 *
 * The classifier inspects the error's `message` (and `code` for `errno`-style network
 * failures). Provider adapters in `shared/translator/providers/*` throw plain `Error`
 * instances with messages of the form `"<Provider> HTTP <status>: <details>"`, which is
 * what the regexes below target. Errors raised through `I18nPruneError` are also
 * supported via their `.message`.
 *
 * **Branch order** is significant — earlier branches win:
 * 1. `429` / "too many requests" → `quota_exceeded` (when a daily-cap signal is present)
 *    or `rate_limited`.
 * 2. `401` / `403` / "unauthorized" / "forbidden" → `auth_failure`.
 * 3. `errno` network codes or "fetch failed" / /network/ → `transient_network`.
 * 4. `5xx` / "service unavailable" → `provider_unavailable`.
 * 5. "invalid json" / "malformed" / "unexpected token" → `malformed_response`.
 * 6. Anything else → `unknown_hard_stop`.
 *
 * @example
 * ```ts
 * try {
 *   await provider.translate('Hello', 'en', 'fr');
 * } catch (err) {
 *   const outcome = classifyTranslateFailure(err);
 *   // outcome → 'rate_limited' | 'quota_exceeded' | …
 * }
 * ```
 *
 * @param err - Error thrown by a provider adapter or any code in the leaf-translate path.
 * @returns The classified outcome. Never throws.
 *
 * @remarks
 * Step 1 of the translate-policy plan. Steps 3 (`ProviderHealthMonitor`) and 5
 * (`resolveProviderActionFor`) consume this output without re-deriving classification.
 * Avoid duplicating the regex/code matching elsewhere — call this function instead.
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
