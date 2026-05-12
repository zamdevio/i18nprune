/**
 * Public SDK entry — translate a list of strings (or keyed leaves) with the full per-provider
 * chain, retries, identity-streak guard, parallelism, and rate-limit math. SDK consumers can
 * call this directly; **`runGenerate`** uses the same primitive internally.
 */

import { I18nPruneError } from '../shared/errors/index.js';
import { translateLeaf } from '../shared/translator/index.js';
import { resolveTranslator } from '../shared/translator/providers/registry.js';
import { resolveTranslateConfig } from '../config/resolve/translate.js';
import { mapWithConcurrencyWithProgress } from '../shared/translator/utils/orchestration.js';
import { createIdentityStreakGuard, IDENTITY_STREAK_THRESHOLD } from './identity/index.js';
import {
  classifyProviderFailureOutcome,
  isRetryableProviderFailure,
} from './policy/fallback.js';
import { resolveTranslateMaxParallelEffective } from './limits/parallel.js';
import {
  assertTranslationProviderCredentialsReady,
  resolveTranslationProviderOptionsForId,
} from './providers/options.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { TranslationResult } from '../types/translator/result.js';
import type { TranslationProviderId } from '../types/translator/providers.js';
import type {
  ProviderAttemptReport,
  TranslateOptions,
  TranslateOutput,
  TranslateResultItem,
  TranslateRunPartialStats,
} from '../types/translator/translate.js';
import type { TranslateContext } from './context.js';

type InternalLeaf = {
  readonly originalIndex: number;
  readonly key?: string;
  readonly source: string;
};

const ZERO_STATS: TranslateRunPartialStats = {
  requestAttempts: 0,
  retriesMade: 0,
  successfulLeaves: 0,
  failedRequests: 0,
};

function addStats(a: TranslateRunPartialStats, b: TranslateRunPartialStats): TranslateRunPartialStats {
  return {
    requestAttempts: a.requestAttempts + b.requestAttempts,
    retriesMade: a.retriesMade + b.retriesMade,
    successfulLeaves: a.successfulLeaves + b.successfulLeaves,
    failedRequests: a.failedRequests + b.failedRequests,
  };
}

function normalizeOptionLeaves(opts: TranslateOptions): InternalLeaf[] {
  if (opts.texts !== undefined && opts.leaves !== undefined) {
    throw new I18nPruneError(
      'runTranslate: pass `texts` OR `leaves`, not both.',
      'USAGE',
    );
  }
  if (opts.leaves !== undefined) {
    return opts.leaves.map((leaf, i) => ({
      originalIndex: i,
      key: leaf.key,
      source: leaf.source,
    }));
  }
  if (opts.texts !== undefined) {
    return opts.texts.map((source, i) => ({ originalIndex: i, source }));
  }
  return [];
}

function buildSuccessItem(
  leaf: InternalLeaf,
  tr: TranslationResult,
  providerId: TranslationProviderId,
): TranslateResultItem {
  return {
    ok: true,
    ...(leaf.key !== undefined ? { key: leaf.key } : {}),
    value: tr.text,
    providerId,
    ...(tr.leafMeta ? { leafMeta: tr.leafMeta } : {}),
  };
}

function buildSkippedItem(leaf: InternalLeaf): TranslateResultItem {
  return {
    ok: false,
    ...(leaf.key !== undefined ? { key: leaf.key } : {}),
    reason: 'skipped',
    sourceValue: leaf.source,
  };
}

function buildFailureItem(leaf: InternalLeaf): TranslateResultItem {
  return {
    ok: false,
    ...(leaf.key !== undefined ? { key: leaf.key } : {}),
    reason: 'failed',
    sourceValue: leaf.source,
  };
}

function leafIdentityKey(leaf: InternalLeaf): string {
  return leaf.key ?? String(leaf.originalIndex);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Translate one batch of leaves with a single provider; pool semantics use
 * **`mapWithConcurrencyWithProgress`** so progress hooks work even when the run is interrupted.
 *
 * Returns the per-leaf results map plus this attempt's stats. Throws when *any* leaf rejects so the
 * outer chain can decide whether to fall back; completed leaves stay recorded in **`results`** so
 * the next provider only retranslates what's still missing.
 */
async function translateBatchWithProvider(args: {
  leaves: InternalLeaf[];
  provider: ReturnType<typeof resolveTranslator>;
  providerId: TranslationProviderId;
  targetLang: string;
  sourceLang: string;
  workers: number;
  rateLimit: ReturnType<typeof import('./limits/parallel.js').resolveTranslateRateLimitEffective>;
  hooks: TranslateOptions['hooks'];
  streakGuard?: ReturnType<typeof createIdentityStreakGuard>;
  results: Map<number, TranslateResultItem>;
}): Promise<TranslateRunPartialStats> {
  const stats = { ...ZERO_STATS };
  if (args.leaves.length === 0) return stats;

  let completed = 0;
  const total = args.leaves.length;

  await mapWithConcurrencyWithProgress(
    args.leaves,
    args.workers,
    async (leaf) => {
      const tr = await translateLeaf(
        args.provider,
        leaf.source,
        args.sourceLang,
        args.targetLang,
        {
          providerId: args.providerId,
          onTranslated: async (sourceText, translatedText) => {
            await args.hooks?.onTranslatedLeaf?.(sourceText, translatedText, leaf.key ?? leaf.originalIndex);
            if (args.streakGuard) {
              await args.streakGuard.onTranslated(sourceText, translatedText, leafIdentityKey(leaf));
            }
          },
        },
      );
      stats.requestAttempts += tr.runtime?.attempts ?? 1;
      stats.retriesMade += tr.runtime?.retries ?? 0;
      stats.successfulLeaves += 1;
      args.results.set(leaf.originalIndex, buildSuccessItem(leaf, tr, args.providerId));
      completed += 1;
      args.hooks?.onTick?.(completed, total, leaf.key ?? String(leaf.originalIndex));
      return tr;
    },
    () => {},
    (leaf) => leaf.key ?? String(leaf.originalIndex),
    args.rateLimit,
  );

  return stats;
}

/**
 * Translate a batch of strings or keyed leaves with the configured provider chain.
 *
 * Behavior:
 * - **`opts.texts`** XOR **`opts.leaves`** — output preserves input order.
 * - Whitespace-only sources skip the network call and surface as **`{ ok: false, reason: 'skipped' }`**.
 * - Provider chain is resolved from **`resolveTranslateConfig`** (config + pin); retryable failures
 *   advance the chain, non-retryable errors throw.
 * - Partial resume across providers: completed leaves carry over, so the next provider only
 *   retranslates still-missing entries.
 * - Identity-streak guard is opt-in via **`opts.identityGuard.enabled`**; warnings are surfaced on
 *   **`output.issues`**. Hosts that need an interactive confirm prompt should keep owning their
 *   own guard via **`opts.hooks.onTranslatedLeaf`**.
 */
export async function runTranslate(
  ctx: TranslateContext,
  opts: TranslateOptions,
): Promise<TranslateOutput> {
  const allLeaves = normalizeOptionLeaves(opts);
  const sourceLang = opts.sourceLang ?? 'en';

  const { resolved, warnings } = resolveTranslateConfig({
    config: ctx.config,
    env: ctx.env,
    pin: opts.pin,
  });
  const providerOrder = resolved.providerOrder;

  // Pre-mark whitespace-only sources as skipped — translator never hits the network for them.
  const results = new Map<number, TranslateResultItem>();
  const translatableLeaves: InternalLeaf[] = [];
  for (const leaf of allLeaves) {
    if (leaf.source.trim() === '') {
      results.set(leaf.originalIndex, buildSkippedItem(leaf));
      continue;
    }
    translatableLeaves.push(leaf);
  }

  const providerAttempts: ProviderAttemptReport[] = [];
  let aggregateStats: TranslateRunPartialStats = { ...ZERO_STATS };
  let winnerProviderId: TranslationProviderId | null = null;
  let lastErr: unknown;

  // Identity-streak guard is created per-run (state spans providers) when opted in.
  const identityEnabled = opts.identityGuard?.enabled === true;
  const streakGuard = identityEnabled
    ? createIdentityStreakGuard({
        command: 'translate',
        target: opts.targetLang,
        threshold: opts.identityGuard?.threshold ?? IDENTITY_STREAK_THRESHOLD,
      })
    : undefined;

  for (let pi = 0; pi < providerOrder.length; pi += 1) {
    const providerId = providerOrder[pi]!;
    const remaining = translatableLeaves.filter((leaf) => !results.has(leaf.originalIndex));
    if (remaining.length === 0) {
      winnerProviderId = providerId;
      break;
    }

    const options = resolveTranslationProviderOptionsForId({
      config: ctx.config,
      id: providerId,
      env: ctx.env,
    });
    assertTranslationProviderCredentialsReady(options);
    const provider = resolveTranslator(options);
    const workers = resolveTranslateMaxParallelEffective({
      config: ctx.config,
      workers: opts.pin?.workers,
      providerId,
      env: ctx.env,
    });
    const rateLimit = resolved.providers[providerId].startRateLimit;

    const startedAt = Date.now();
    let attemptStats: TranslateRunPartialStats = { ...ZERO_STATS };
    try {
      attemptStats = await translateBatchWithProvider({
        leaves: remaining,
        provider,
        providerId,
        targetLang: opts.targetLang,
        sourceLang,
        workers,
        rateLimit,
        hooks: opts.hooks,
        streakGuard,
        results,
      });
      const report: ProviderAttemptReport = {
        providerId,
        outcome: 'success',
        stats: attemptStats,
        durationMs: Date.now() - startedAt,
      };
      providerAttempts.push(report);
      opts.hooks?.onProviderAttempt?.(report);
      aggregateStats = addStats(aggregateStats, attemptStats);
      winnerProviderId = providerId;
      break;
    } catch (e) {
      lastErr = e;
      const failureStats: TranslateRunPartialStats = {
        requestAttempts: attemptStats.requestAttempts,
        retriesMade: attemptStats.retriesMade,
        successfulLeaves: attemptStats.successfulLeaves,
        failedRequests: Math.max(
          1,
          attemptStats.requestAttempts - attemptStats.successfulLeaves,
        ),
      };
      const report: ProviderAttemptReport = {
        providerId,
        outcome: classifyProviderFailureOutcome(e),
        errorMessage: errorMessage(e),
        stats: failureStats,
        durationMs: Date.now() - startedAt,
      };
      providerAttempts.push(report);
      opts.hooks?.onProviderAttempt?.(report);
      aggregateStats = addStats(aggregateStats, failureStats);

      const hasNext = pi < providerOrder.length - 1;
      if (!hasNext || !isRetryableProviderFailure(e)) {
        // Mark all remaining leaves (those not completed by an earlier provider) as failed before
        // throwing so callers can salvage partial output if they catch the error and inspect a
        // stashed `runTranslate` result. Today we only return on success; callers wanting partial
        // output on failure should re-call with the remaining leaves themselves.
        throw e instanceof Error ? e : new Error(String(e));
      }
      // Retryable + has next provider → loop continues with leaves that are still missing.
    }
  }

  // After the loop: every translatable leaf should have a result; missing ones (shouldn't occur
  // unless we exit early) are marked failed for shape stability.
  for (const leaf of translatableLeaves) {
    if (!results.has(leaf.originalIndex)) {
      results.set(leaf.originalIndex, buildFailureItem(leaf));
    }
  }

  // Reconstruct in original input order.
  const ordered: TranslateResultItem[] = new Array(allLeaves.length);
  for (let i = 0; i < allLeaves.length; i += 1) {
    const item = results.get(i);
    if (!item) {
      // Defensive: should not happen — we always pre-mark or populate above.
      const fallback = buildFailureItem(allLeaves[i]!);
      ordered[i] = fallback;
      continue;
    }
    ordered[i] = item;
  }

  const fallbackCount = Math.max(0, providerAttempts.length - 1);
  const issues: Issue[] = streakGuard ? streakGuard.flushIssues() : [];

  // If no provider succeeded (e.g. zero translatable leaves and zero providers attempted), surface a
  // typed error so callers know the chain didn't run.
  if (winnerProviderId === null && providerAttempts.length > 0 && lastErr) {
    // Already threw above; defensive.
  }

  return {
    translations: ordered,
    providerAttempts,
    winnerProviderId,
    fallbackCount,
    translateStats: aggregateStats,
    issues,
    warnings,
  };
}
