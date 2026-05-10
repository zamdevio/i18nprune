/**
 * Public translate-policy surface.
 *
 * Locked verb dictionary, per-outcome action keys, and defaults that drive
 * `runGenerate`'s provider chain through `resolveProviderActionFor` (step 5).
 * SDK consumers author this shape inside `defineConfig({ translate: { policy } })`.
 *
 * Source of truth: `maintainer/phases/translate-policy.md` §3 (schema) + §4 (verb
 * dictionary) + §6 (defaults). When the plan moves a key, this file moves with it.
 */

/**
 * Single action verb returned by the policy resolver for one observed outcome.
 *
 * The verb names *what the orchestrator does*, not which outcome triggered it. The
 * resolver consults the matching `on*` key in {@link TranslatePolicy} (e.g.
 * `onRateLimit` for `rate_limited`) and returns one verb from this set.
 *
 * - `'retry'`     — re-attempt the leaf on the **same** provider; counts toward `maxAttempts`.
 * - `'backoff'`   — pause via `ProviderHealthMonitor` (`Retry-After` or fallback decay), then `'retry'`.
 * - `'fallback'`  — advance to the next entry in `providers[]`; resume from the partial locale.
 * - `'prompt'`    — TTY: open the handoff picker (step 7); non-TTY: degrade to `'fallback'` if
 *                   eligible, else `'abort'`.
 * - `'abort'`     — stop the run with a structured issue. Reserved for auth / hard-stop.
 * - `'flag'`      — only used by `onIdentityOutput`: write source as the leaf and continue;
 *                   the structured leaf gets `needsReview: true` when `--metadata` is on.
 */
export type TranslatePolicyVerb =
  | 'retry'
  | 'backoff'
  | 'fallback'
  | 'prompt'
  | 'abort'
  | 'flag';

/** Verbs accepted by `onRateLimit`. */
export type OnRateLimitVerb = 'backoff' | 'retry' | 'fallback' | 'abort';
/** Verbs accepted by `onTransientFailure`. */
export type OnTransientFailureVerb = 'retry' | 'fallback' | 'abort';
/** Verbs accepted by `onQuotaExceeded`. */
export type OnQuotaExceededVerb = 'fallback' | 'prompt' | 'abort';
/** Verbs accepted by `onAuthFailure`. */
export type OnAuthFailureVerb = 'abort' | 'prompt';
/** Verbs accepted by `onProviderUnavailable`. */
export type OnProviderUnavailableVerb = 'fallback' | 'abort';
/** Verbs accepted by `onIdentityOutput`. */
export type OnIdentityOutputVerb = 'flag' | 'fallback' | 'abort';
/** Verbs accepted by `onIncompleteRun`. */
export type OnIncompleteRunVerb = 'confirm' | 'write' | 'discard';

/** Chain mode. `'single'` runs one provider; `'auto'` walks `providers[]` on retryable failures. */
export type TranslateRoutingMode = 'single' | 'auto';

/**
 * Mid-run handoff picker mode (step 7).
 * - `'auto'` — TTY: prompt when `routing: 'single'`; non-TTY: silent fallback.
 * - `'on'`   — always prompt (TTY only; non-TTY degrades to fallback).
 * - `'off'`  — never prompt.
 */
export type TranslateHandoffMode = 'auto' | 'on' | 'off';

/**
 * Resolved per-outcome translate-policy. **All keys optional** — defaults are documented
 * in {@link TRANSLATE_POLICY_DEFAULTS} and applied during config parse.
 *
 * Authored under `defineConfig({ translate: { policy } })`. Consumers should never
 * read partial fields directly; use the resolved policy from `runGenerate` context
 * (or `parseI18nPruneConfig`'s output) which has every key filled in.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'i18nprune/core/config';
 *
 * export default defineConfig({
 *   source: 'locales/en.json',
 *   localesDir: 'locales',
 *   src: 'src',
 *   functions: ['t'],
 *   translate: {
 *     primary: 'google',
 *     providers: [{ id: 'google' }, { id: 'mymemory', enabled: false }],
 *     policy: {
 *       routing: 'auto',
 *       onRateLimit: 'backoff',
 *       onQuotaExceeded: 'fallback',
 *       handoff: 'auto',
 *     },
 *   },
 * });
 * ```
 */
export type TranslatePolicy = {
  routing?: TranslateRoutingMode;
  /** Action when the provider returns HTTP 429 / "too many requests". */
  onRateLimit?: OnRateLimitVerb;
  /** Action for transient network blips and `ECONNRESET`-style errors. */
  onTransientFailure?: OnTransientFailureVerb;
  /** Action when the provider explicitly says daily/monthly quota is exhausted. */
  onQuotaExceeded?: OnQuotaExceededVerb;
  /** Action for HTTP 401 / 403. Defaults to `'abort'` — never silently swap on auth failure. */
  onAuthFailure?: OnAuthFailureVerb;
  /** Action for sustained 5xx / DNS / "wall of unavailable". */
  onProviderUnavailable?: OnProviderUnavailableVerb;
  /** Action when the provider returned the source string unchanged. */
  onIdentityOutput?: OnIdentityOutputVerb;
  /**
   * Action when a run can't finish all leaves (cap hit, abort verb fired, or interrupt).
   * Step 10 of the plan wires this into a host hook.
   */
  onIncompleteRun?: OnIncompleteRunVerb;
  /**
   * Cross-provider attempts per leaf. Default = `providers.length` (one shot per provider in chain).
   * On cap hit, the leaf is **flagged** (per `onIdentityOutput`) — the run is **never** aborted.
   */
  maxAttempts?: number;
  /** Mid-run rescue prompt control (step 7). */
  handoff?: TranslateHandoffMode;
};

/**
 * Frozen defaults for {@link TranslatePolicy}. Mirrors `maintainer/phases/translate-policy.md` §6.
 * `maxAttempts` is intentionally absent here — it's resolved against `providers.length` at parse time.
 *
 * @remarks
 * Step 4 of `maintainer/phases/translate-policy.md`. Consumed by `parseI18nPruneConfig` /
 * `defineConfig`'s policy merge and by step 5's resolver as the fallback for missing keys.
 */
export const TRANSLATE_POLICY_DEFAULTS: Readonly<
  Required<Omit<TranslatePolicy, 'maxAttempts'>>
> = Object.freeze({
  routing: 'single',
  onRateLimit: 'backoff',
  onTransientFailure: 'retry',
  onQuotaExceeded: 'fallback',
  onAuthFailure: 'abort',
  onProviderUnavailable: 'fallback',
  onIdentityOutput: 'flag',
  onIncompleteRun: 'confirm',
  handoff: 'auto',
});
