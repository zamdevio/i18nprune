import type { TranslateFailureOutcome } from '../../../translator/policy/classify.js';

/**
 * Outcome class accepted by {@link ProviderHealthMonitor.onAttemptResult}. Extends the failure
 * taxonomy with `'success'`, which resets the consecutive-backoff counter for that provider.
 */
export type ProviderHealthOutcome = 'success' | TranslateFailureOutcome;

/**
 * One attempt's worth of evidence the resolver feeds into the monitor.
 *
 * @remarks
 * The monitor does not interpret which outcomes "deserve" a backoff. Callers (the policy
 * resolver in step 5) decide which attempts to report — typically only when the resolved
 * verb is `'backoff'`. Reporting an attempt always advances the counter (unless `outcome`
 * is `'success'`) and may extend the no-start-before deadline if a hint is supplied or the
 * exponential fallback applies.
 */
export type ProviderAttemptObservation = {
  readonly providerId: string;
  readonly outcome: ProviderHealthOutcome;
  /**
   * Optional `Retry-After`-derived hint. When present and positive, extends the
   * "no-start-before" deadline by `retryAfterMs`. The exponential fallback is skipped
   * for this attempt — host hint always wins.
   */
  readonly hint?: { readonly retryAfterMs?: number };
};

/**
 * Per-provider start-gate health state. The interface is the **load-bearing primitive** of
 * step 3 in `maintainer/phases/translate-policy.md`; the start-rate gate consults
 * {@link ProviderHealthMonitor.shouldDelayStartFor} on top of `rpm` / `rps` / `intervalMs`
 * pacing, and the policy resolver consults {@link ProviderHealthMonitor.shouldEscalate}
 * to upgrade `backoff` → `fallback` after consecutive backoffs exhaust.
 */
export interface ProviderHealthMonitor {
  /** Record one attempt for `providerId`. */
  onAttemptResult(input: ProviderAttemptObservation): void;
  /** Extra delay (ms) the start gate should add before launching a job for this provider. `0` if healthy. */
  shouldDelayStartFor(providerId: string): number;
  /** Consecutive non-success outcomes recorded since the last `'success'` (or process start). */
  consecutiveBackoffsFor(providerId: string): number;
  /** True when this provider's consecutive-backoff count is at or above the resolver's threshold. */
  shouldEscalate(providerId: string, policy: { readonly maxBackoffsBeforeEscalate: number }): boolean;
}

export type ProviderHealthMonitorOptions = {
  /** Clock for testability. Defaults to `() => Date.now()`. Must return wall-clock ms. */
  readonly now?: () => number;
  /**
   * Exponential fallback ms used when no `Retry-After` hint accompanies a failure. The array
   * is indexed by `consecutiveBackoffsFor(providerId) - 1`, clamped to the last entry once
   * exhausted. Defaults to `[1_000, 2_000, 4_000, 8_000, 16_000]`.
   */
  readonly fallbackBackoffMs?: readonly number[];
};

const DEFAULT_FALLBACK_BACKOFF_MS: readonly number[] = [1_000, 2_000, 4_000, 8_000, 16_000];

/**
 * Build a provider-health bookkeeper for the translate-policy backoff sub-algorithm.
 *
 * **Pure** — no I/O, no implicit clock; the only environmental dependency is `Date.now()`,
 * and that can be replaced via {@link ProviderHealthMonitorOptions.now} for tests. State is
 * held in closed-over `Map`s; instances are not safe to share across concurrent runs of
 * different policies.
 *
 * Behavior contract:
 * - `onAttemptResult({ outcome: 'success' })` resets the counter for that provider.
 * - Any other outcome increments the counter.
 * - When `hint.retryAfterMs > 0`, the no-start-before deadline is extended to at least
 *   `now() + retryAfterMs`. Existing earlier deadlines are kept (max wins).
 * - When no hint is given **and** the outcome is non-success, the deadline is extended by
 *   `fallbackBackoffMs[min(count - 1, fallbackBackoffMs.length - 1)]` — exponential decay
 *   that clamps at the last bucket.
 * - `shouldDelayStartFor` returns `max(0, deadline - now())`. Healthy providers report `0`.
 *
 * @example
 * ```ts
 * const monitor = createProviderHealthMonitor();
 * monitor.onAttemptResult({ providerId: 'google', outcome: 'rate_limited', hint: { retryAfterMs: 5_000 } });
 * monitor.shouldDelayStartFor('google'); // ≈ 5000 ms, decreasing as wall clock advances
 * monitor.consecutiveBackoffsFor('google'); // 1
 * monitor.shouldEscalate('google', { maxBackoffsBeforeEscalate: 3 }); // false
 * ```
 *
 * @remarks
 * Step 3 of `maintainer/phases/translate-policy.md`. Internal substrate — exported only so
 * SDK consumers building custom translator orchestrators can construct one. Most callers
 * receive the instance from `runGenerate`'s policy resolver in step 5.
 */
export function createProviderHealthMonitor(options?: ProviderHealthMonitorOptions): ProviderHealthMonitor {
  const now = options?.now ?? ((): number => Date.now());
  const fallbackBackoffMs = options?.fallbackBackoffMs ?? DEFAULT_FALLBACK_BACKOFF_MS;
  const consec = new Map<string, number>();
  const noStartBefore = new Map<string, number>();

  const extendDeadline = (providerId: string, ms: number): void => {
    if (!(ms > 0)) return;
    const deadline = now() + ms;
    const cur = noStartBefore.get(providerId) ?? 0;
    if (deadline > cur) noStartBefore.set(providerId, deadline);
  };

  return {
    onAttemptResult({ providerId, outcome, hint }) {
      if (outcome === 'success') {
        consec.set(providerId, 0);
        return;
      }
      const next = (consec.get(providerId) ?? 0) + 1;
      consec.set(providerId, next);

      const retryAfterMs = hint?.retryAfterMs;
      if (typeof retryAfterMs === 'number' && retryAfterMs > 0) {
        extendDeadline(providerId, retryAfterMs);
        return;
      }
      if (fallbackBackoffMs.length === 0) return;
      const idx = Math.min(next - 1, fallbackBackoffMs.length - 1);
      extendDeadline(providerId, fallbackBackoffMs[idx] ?? 0);
    },
    shouldDelayStartFor(providerId) {
      const deadline = noStartBefore.get(providerId);
      if (deadline === undefined) return 0;
      return Math.max(0, deadline - now());
    },
    consecutiveBackoffsFor(providerId) {
      return consec.get(providerId) ?? 0;
    },
    shouldEscalate(providerId, policy) {
      return (consec.get(providerId) ?? 0) >= policy.maxBackoffsBeforeEscalate;
    },
  };
}
