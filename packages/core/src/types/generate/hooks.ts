/**
 * Decision hooks for {@link runGenerate}. Pure type contracts: hosts implement them; core awaits
 * each one at a defined consent point and the host's return value drives the run.
 *
 * Observability is intentionally **not** here — the existing `RunEmitter` / `RunEvent` surface
 * already carries `run.progress.generate`, `run.started`, `run.completed`, `run.summary`, and
 * `run.failed`. New observability needs extend that union, not these hooks.
 */

import type { TranslationProviderId } from '../translator/providers.js';
import type { TranslateRunPartialStats } from '../translator/runStats.js';
import type { ProviderAttemptReportJson } from './generateRun.js';

/**
 * Why **`runGenerate`** stopped before all source leaves were translated. Hosts use this to choose
 * the right copy in the prompt and the right default action.
 */
export type IncompleteRunReason =
  /** Every provider in the chain was attempted; all failed with retryable errors (network / 5xx / rate-limit). */
  | 'provider_chain_exhausted'
  /** Mid-run hard failure (non-retryable error from a provider). Partial JSON is in memory. */
  | 'partial_after_non_retryable'
  /** Every provider hit a rate-limit window and the run can't make forward progress without waiting. */
  | 'rate_limit_persistent';

/** Information passed to {@link GenerateRunHooks.onIncomplete}. */
export type IncompleteRunInfo = {
  readonly target: string;
  readonly reason: IncompleteRunReason;
  readonly partial: TranslateRunPartialStats;
  readonly successfulLeaves: number;
  readonly failedLeaves: number;
  readonly providerAttempts: readonly ProviderAttemptReportJson[];
  readonly remainingProviderIds: readonly TranslationProviderId[];
  readonly lastError?: { readonly code: string; readonly message: string };
};

/**
 * Host's choice when {@link GenerateRunHooks.onIncomplete} is asked.
 *
 * - **`write_partial`** — keep what we have. **`metadata: true`** runs mark untranslated leaves
 *   **`needsReview: true`** so a later **`generate --resume`** can top them up.
 * - **`abort_no_write`** — re-throw the last error; no file is written; matches today's default.
 * - **`retry_provider`** — try another provider id from {@link IncompleteRunInfo.remainingProviderIds}
 *   with the partial state still in memory (no re-translation of completed leaves).
 */
export type IncompleteRunDecision =
  | { readonly action: 'write_partial' }
  | { readonly action: 'abort_no_write' }
  | { readonly action: 'retry_provider'; readonly providerId: TranslationProviderId };

/** Information passed to {@link GenerateRunHooks.onHandoffPick} when more than one provider remains. */
export type HandoffOffer = {
  readonly target: string;
  readonly failedProviderId: TranslationProviderId;
  readonly failureReason: 'rate_limited' | 'network_error' | 'non_retryable_error';
  readonly remainingProviderIds: readonly TranslationProviderId[];
  readonly partialStats: TranslateRunPartialStats;
};

/**
 * Decision hooks for **`runGenerate`**. Each is optional; omitting one means "use core's default
 * policy" (today: throw on chain exhaustion, advance linearly through the provider chain).
 *
 * Hosts that need full UX (CLI prompt, web modal, etc.) supply these. Headless hosts (CI, Worker,
 * SDK) typically supply policy-only implementations: e.g. `onIncomplete: async () => ({ action: 'write_partial' })`.
 */
export type GenerateRunHooks = {
  /**
   * Called when **`runGenerate`** can't finish a target without help. The decision drives the next
   * step: keep the partial output, abort cleanly, or retry with another provider.
   */
  readonly onIncomplete?: (info: IncompleteRunInfo) => Promise<IncompleteRunDecision>;

  /**
   * Called between providers when more than one remains in the chain after a retryable failure.
   * Returning a provider id from {@link HandoffOffer.remainingProviderIds} pins that next attempt;
   * returning **`null`** keeps the natural order (the next id in the resolved chain).
   */
   readonly onHandoffPick?: (offer: HandoffOffer) => Promise<TranslationProviderId | null>;
};
