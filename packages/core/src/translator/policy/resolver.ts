import type { ProviderHealthMonitor } from '../../shared/translator/utils/providerHealth.js';
import type {
  TranslatePolicy,
  TranslatePolicyVerb,
} from '../../types/translator/policy.js';
import { TRANSLATE_POLICY_DEFAULTS } from '../../types/translator/policy.js';
import type { TranslateFailureOutcome } from './classify.js';

/**
 * Policy keys that carry a verb (i.e. the `on*` keys). Excludes scalars like
 * `routing` / `maxAttempts` / `handoff`. {@link policyKeyForOutcome} narrows to
 * this set so callers can index {@link TRANSLATE_POLICY_DEFAULTS} safely.
 */
type VerbPolicyKey = Extract<
  keyof TranslatePolicy,
  | 'onRateLimit'
  | 'onTransientFailure'
  | 'onQuotaExceeded'
  | 'onAuthFailure'
  | 'onProviderUnavailable'
  | 'onIdentityOutput'
  | 'onIncompleteRun'
>;

/**
 * One canonical decision the resolver returns. Carries enough diagnostic context
 * for `runGenerate` (step 6) to log the policy choice without re-deriving why.
 */
export type TranslatePolicyAction = {
  /** The action `runGenerate` should apply for this attempt. */
  readonly verb: TranslatePolicyVerb;
  /**
   * When the resolver upgraded a softer verb to a harder one (currently only
   * `'backoff'` → `'fallback'` via `health.shouldEscalate`), this records the
   * pre-escalation verb. Absent when the policy verb stood as-is.
   */
  readonly escalatedFrom?: TranslatePolicyVerb;
  /**
   * Stable, machine-friendly explanation. One of:
   * - `policy.<key>=<verb>` — the verb came verbatim from the user's policy entry.
   * - `unknown_hard_stop_always_aborts` — D9 hardcoded path.
   * - `escalated_after_backoff_streak>=<N>` — health monitor exhausted.
   *
   * Stable enough for tests and JSON-envelope route summaries (step 8).
   */
  readonly reason: string;
};

/**
 * Inputs for {@link resolveProviderActionFor}. Everything required is host-agnostic.
 */
export type ResolveProviderActionInput = {
  /** Classified outcome of the failed attempt (from {@link classifyTranslateFailure}). */
  readonly outcome: TranslateFailureOutcome;
  /** Resolved translate-policy from `parseI18nPruneConfig` (every key present). */
  readonly policy: TranslatePolicy;
  /** Shared per-run health monitor. The resolver records the attempt when it returns `'backoff'`. */
  readonly health: ProviderHealthMonitor;
  /** Provider id whose attempt just failed. Required for health bookkeeping. */
  readonly providerId: string;
  /**
   * Per-provider backoff escalation threshold. After this many consecutive backoffs on
   * the same provider, the resolver upgrades `'backoff'` → `'fallback'`.
   *
   * Per `maintainer/phases/translate-policy.md` §7, callers derive this from
   * `ceil(policy.maxAttempts / chain.length)` so the cross-provider budget yields
   * "one shot per provider in chain" by default. When omitted, falls back to
   * `policy.maxAttempts ?? 1` — the safe value for single-provider setups but a
   * footgun for multi-provider chains, so the caller is expected to pass it.
   */
  readonly escalationThreshold?: number;
  /**
   * Optional `Retry-After`-derived hint forwarded to the health monitor when the
   * resolver decides to record a backoff. When absent, the monitor's exponential
   * fallback applies.
   */
  readonly hint?: { readonly retryAfterMs?: number };
};

/**
 * Map an outcome to the policy key whose verb governs it. Exported for tests and
 * for the JSON envelope's diagnostic strings (step 8). The function is total over
 * {@link TranslateFailureOutcome} except for `'unknown_hard_stop'`, which has no
 * user-facing key — D9 locks it to `'abort'`.
 *
 * `'malformed_response'` shares a key with `'provider_unavailable'`: a malformed
 * payload signals "this provider is broken right now", which is the same intent
 * users author for sustained 5xx.
 */
export function policyKeyForOutcome(
  outcome: TranslateFailureOutcome,
): VerbPolicyKey | undefined {
  switch (outcome) {
    case 'rate_limited':
      return 'onRateLimit';
    case 'transient_network':
      return 'onTransientFailure';
    case 'quota_exceeded':
      return 'onQuotaExceeded';
    case 'auth_failure':
      return 'onAuthFailure';
    case 'provider_unavailable':
    case 'malformed_response':
      return 'onProviderUnavailable';
    case 'unknown_hard_stop':
      return undefined;
    default: {
      const _exhaustive: never = outcome;
      void _exhaustive;
      return undefined;
    }
  }
}

/**
 * **The single source of truth** for "given a failed provider attempt, what verb
 * should `runGenerate` apply next?". Step 5 of `maintainer/phases/translate-policy.md`.
 *
 * The resolver is the canonical consumer of {@link classifyTranslateFailure}'s
 * output and the canonical writer of {@link ProviderHealthMonitor} updates in the
 * backoff path. It is **not** responsible for executing the verb — that's the
 * caller's job (step 6) — only for choosing it. Specifically:
 *
 * - **Verb feasibility is the caller's concern.** A `'fallback'` verb may not
 *   be executable when `routing: 'single'` or when the current provider is the
 *   last in the chain; the caller degrades. A `'prompt'` verb may not be
 *   executable when the host is non-TTY; the caller degrades.
 * - **`maxAttempts` enforcement is the caller's concern.** This resolver does
 *   not know how many leaves the run has touched, only the per-provider
 *   consecutive-backoff state.
 *
 * @remarks
 * **Side effect:** when the resolver returns `'backoff'` (either from the policy
 * verb or pre-escalation), it calls `health.onAttemptResult({ providerId, outcome,
 * hint })`. This advances the per-provider streak counter and may extend the
 * start-gate deadline. The health monitor's contract documents this as the
 * resolver's responsibility — callers should *not* duplicate the call.
 *
 * **Escalation:** when the policy verb is `'backoff'` AND
 * `health.shouldEscalate(providerId, …)` is true after recording the attempt,
 * the verb upgrades to `'fallback'`. The threshold is `policy.maxAttempts`
 * (defaults to `providers.length` per plan §6) — interpreted as "after this many
 * consecutive backoffs on this provider, advance the chain".
 *
 * **`'unknown_hard_stop'`:** D9 locks this outcome to `'abort'`. No policy key
 * consults it; users who want a different behavior must rely on classifier
 * tightening (step 1) to map their error into a finer outcome.
 *
 * **`'malformed_response'`:** shares the `onProviderUnavailable` key. A future
 * slice may add a dedicated `onMalformedResponse` key — schema is `.strict()`,
 * so the change would be additive and isolated to one file (D7).
 *
 * @example
 * ```ts
 * const outcome = classifyTranslateFailure(err);
 * const action = resolveProviderActionFor({
 *   outcome,
 *   policy: ctx.config.translate.policy,
 *   health,
 *   providerId: 'google',
 *   hint: { retryAfterMs: parseRetryAfter(res) },
 * });
 *
 * switch (action.verb) {
 *   case 'retry':    // retry same provider
 *   case 'backoff':  // start gate already extended; just retry after wait
 *   case 'fallback': // advance chain; caller checks feasibility
 *   case 'prompt':   // open handoff picker (TTY) or degrade
 *   case 'abort':    // emit structured issue and stop the run
 *   case 'flag':     // unreachable in failure path; only valid for onIdentityOutput
 * }
 * ```
 *
 * @returns {@link TranslatePolicyAction} with the chosen verb, optional
 *   `escalatedFrom`, and a stable `reason` string.
 */
export function resolveProviderActionFor(
  input: ResolveProviderActionInput,
): TranslatePolicyAction {
  const { outcome, policy, health, providerId, hint, escalationThreshold } = input;

  if (outcome === 'unknown_hard_stop') {
    return { verb: 'abort', reason: 'unknown_hard_stop_always_aborts' };
  }

  const key = policyKeyForOutcome(outcome);
  // Only `unknown_hard_stop` returns undefined here, and it's handled above.
  // The runtime check is a defense-in-depth for future outcome additions.
  if (key === undefined) {
    return { verb: 'abort', reason: `unmapped_outcome:${outcome}` };
  }

  const verbFromPolicy = (policy[key] ??
    TRANSLATE_POLICY_DEFAULTS[key]) as TranslatePolicyVerb;

  if (verbFromPolicy !== 'backoff') {
    return { verb: verbFromPolicy, reason: `policy.${key}=${verbFromPolicy}` };
  }

  health.onAttemptResult({ providerId, outcome, hint });

  const threshold = Math.max(1, escalationThreshold ?? policy.maxAttempts ?? 1);
  if (health.shouldEscalate(providerId, { maxBackoffsBeforeEscalate: threshold })) {
    return {
      verb: 'fallback',
      escalatedFrom: 'backoff',
      reason: `escalated_after_backoff_streak>=${String(threshold)}`,
    };
  }

  return { verb: 'backoff', reason: `policy.${key}=backoff` };
}
