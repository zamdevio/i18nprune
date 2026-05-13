/**
 * Decision hooks for {@link runGenerate}. Pure type contracts: hosts implement them; core awaits
 * each one at a defined consent point and the host's return value drives the run.
 *
 * Observability is intentionally **not** here — the existing `RunEmitter` / `RunEvent` surface
 * carries `run.message`, `run.progress.generate`, `run.started`, `run.completed`, `run.summary`,
 * and `run.failed`. New observability needs extend that union, not these hooks.
 */

import type { TranslateFailureOutcome } from '../../translator/policy/classify.js';
import type { HandoffEligibilityRow } from '../../translator/policy/handoff.js';
import type { TranslationProviderId } from '../translator/providers.js';
import type { TranslateRunPartialStats } from '../translator/runStats.js';
import type { ProviderAttemptReportJson } from './generateRun.js';

export type { HandoffEligibilityRow };

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

/** Information passed to {@link GenerateRunHooks.onHandoffPick}. */
export type HandoffOffer = {
  readonly target: string;
  readonly failedProviderId: TranslationProviderId;
  readonly failureReason: 'rate_limited' | 'network_error' | 'non_retryable_error';
  /** Classifier outcome for richer host copy (optional — legacy **`failureReason`** stays stable). */
  readonly translateFailureOutcome?: TranslateFailureOutcome;
  /** Config chain remainder (may be empty when **`routing: single`**). */
  readonly remainingProviderIds: readonly TranslationProviderId[];
  readonly partialStats: TranslateRunPartialStats;
  /**
   * Built-in catalogue pool eligible for rescue picks — **not** the same shape as **`remainingProviderIds`**
   * (`translate-policy (shipped)` §8). Hosts render this list; **`onHandoffPick`** must return **`null`** (means
   * “first **`eligibleHandoffRows`** entry”) or an id present in this list.
   */
  readonly eligibleHandoffRows: readonly HandoffEligibilityRow[];
};

/**
 * Decision hooks for **`runGenerate`**. Each is optional; omitting one means "use core's default
 * for that consent point" (see **`translate.policy`** merge in core).
 *
 * Hosts that need full UX (CLI prompt, web modal, etc.) supply these. Headless hosts (CI, Worker,
 * SDK) often omit **`onIncomplete`** so **`onIncompleteRun: 'confirm'`** defaults to **`write_partial`**
 * in core, or set **`onIncompleteRun: 'write'`** / **`'discard'`** for policy-only behavior.
 */
export type GenerateRunHooks = {
  /**
   * Invoked only when **`translate.policy.onIncompleteRun`** is **`'confirm'`** and a target stops
   * before every leaf finished. Return **`write_partial`** to finalize and write in-memory JSON, or
   * **`abort_no_write`** to rethrow the last error. **`retry_provider`** is reserved (throws if returned).
   * For **`onIncompleteRun: 'write'`** or **`'discard'`**, core does not call **`onIncomplete`**.
   */
  readonly onIncomplete?: (info: IncompleteRunInfo) => Promise<IncompleteRunDecision>;

  /**
   * Mid-run picker for **`prompt`** verbs (`quota_exceeded · prompt`, **`onAuthFailure: prompt`**, …).
   * Return **`null`** to accept the default (**first **`eligibleHandoffRows`** row**). Any non-null id
   * must appear in **`offer.eligibleHandoffRows`**.
   */
   readonly onHandoffPick?: (offer: HandoffOffer) => Promise<TranslationProviderId | null>;
};
