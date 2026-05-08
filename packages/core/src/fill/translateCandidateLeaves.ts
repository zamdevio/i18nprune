import { setAtPath } from '../shared/json/index.js';
import { localePathLooksTranslatedFromSource } from '../shared/translator/localePathTranslated.js';
import { localeJsonValueFromTranslation, translateLeaf } from '../shared/translator/index.js';
import { TranslateRunInterruptedError } from '../generate/translateRunInterruptedError.js';
import { mapWithConcurrencyWithProgress } from '../shared/translator/utils/orchestration.js';
import { isFillCandidateLeaf } from './eligibleLeaves.js';
import type { ReviewLeafRow } from '../review/collectReviewLeaves.js';
import type { Translator } from '../types/translator/index.js';
import type { TranslationProviderId } from '../types/translator/providers.js';
import type { EffectiveReferenceConfig } from '../types/reference/index.js';
import type { ParityPolicy, PreservePolicy } from '../types/policies/index.js';
import type { FillEligibilityRefContext } from '../types/fill/index.js';
import type { TranslationResult } from '../types/translator/result.js';
import type { TranslationTickProgressFn } from '../types/progress/index.js';
import type { TranslateStartRateLimit } from '../types/translator/rateLimit.js';

function applyCompletedFillJobs(input: {
  next: unknown;
  jobs: readonly { leafIndex: number; path: string; value: string }[];
  trByLeafIndex: Map<number, TranslationResult>;
  persistStructuredLeafMetadata: boolean;
}): unknown {
  let out = input.next;
  for (const j of input.jobs) {
    const tr = input.trByLeafIndex.get(j.leafIndex);
    if (!tr) continue;
    out = setAtPath(
      out,
      j.path,
      localeJsonValueFromTranslation(input.persistStructuredLeafMetadata, tr),
    );
  }
  return out;
}

/**
 * Fill: walk review leaves, translate candidates that still match source, update JSON.
 * Host supplies progress ticks and optional per-leaf callback (e.g. identity streak guard).
 */
export async function translateFillCandidateLeaves(input: {
  tLeaves: readonly ReviewLeafRow[];
  next: unknown;
  sourceMap: Map<string, string>;
  refCtx: FillEligibilityRefContext;
  eff: EffectiveReferenceConfig;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
  provider: Translator;
  providerId: TranslationProviderId;
  persistStructuredLeafMetadata: boolean;
  target: string;
  dryRun: boolean;
  /** Max in-flight **`translateLeaf`** calls; **1** keeps serial semantics (default). */
  maxParallelTranslates?: number;
  rateLimit?: TranslateStartRateLimit;
  tickProgress: TranslationTickProgressFn;
  onTranslatedLeaf?: (sourceText: string, translatedText: string, path: string) => Promise<void> | void;
}): Promise<{
  next: unknown;
  changed: number;
  translateStats: {
    requestAttempts: number;
    retriesMade: number;
    successfulLeaves: number;
    failedRequests: number;
  };
  /** Count of translated leaves classified as review-needed by policy/meta pipeline. */
  markedForReview: number;
}> {
  const maxParallel = Math.max(1, Math.min(64, Math.floor(input.maxParallelTranslates ?? 1)));
  const gapMs = Math.max(
    input.rateLimit?.intervalMs ?? 0,
    input.rateLimit?.rpm && input.rateLimit.rpm > 0 ? 60_000 / input.rateLimit.rpm : 0,
    input.rateLimit?.rps && input.rateLimit.rps > 0 ? 1_000 / input.rateLimit.rps : 0,
  );
  let nextAllowedStart = 0;
  const waitForRateWindow = async (): Promise<void> => {
    if (!(gapMs > 0)) return;
    const now = Date.now();
    const waitMs = Math.max(0, nextAllowedStart - now);
    if (waitMs > 0) await new Promise<void>((r) => setTimeout(r, waitMs));
    nextAllowedStart = Date.now() + gapMs;
  };
  let next = input.next;
  let changed = 0;
  const total = input.tLeaves.length;

  const leafDone = new Array<boolean>(total).fill(false);
  let watermark = 0;

  const flushTicks = (): void => {
    while (watermark < total && leafDone[watermark]) {
      input.tickProgress(watermark + 1, total, input.tLeaves[watermark]!.path);
      watermark += 1;
    }
  };

  const markLeafDone = (leafIndex: number): void => {
    leafDone[leafIndex] = true;
    flushTicks();
  };

  type FillJob = { leafIndex: number; path: string; value: string };
  const jobs: FillJob[] = [];

  for (let i = 0; i < input.tLeaves.length; i++) {
    const leaf = input.tLeaves[i]!;
    if (
      !isFillCandidateLeaf({
        leaf,
        sourceMap: input.sourceMap,
        refCtx: input.refCtx,
        eff: input.eff,
        preserve: input.preserve,
        parity: input.parity,
      })
    ) {
      markLeafDone(i);
      continue;
    }
    if (input.dryRun) {
      changed += 1;
      markLeafDone(i);
      continue;
    }
    if (localePathLooksTranslatedFromSource(next, leaf.path, leaf.value)) {
      markLeafDone(i);
      continue;
    }
    jobs.push({ leafIndex: i, path: leaf.path, value: leaf.value });
  }

  const trByLeafIndex = new Map<number, TranslationResult>();
  let requestAttempts = 0;
  let retriesMade = 0;
  let successfulLeaves = 0;
  let markedForReview = 0;

  try {
    if (jobs.length > 0) {
      if (maxParallel <= 1) {
        for (const j of jobs) {
          const leaf = input.tLeaves[j.leafIndex]!;
          await waitForRateWindow();
          const tr = await translateLeaf(input.provider, leaf.value, 'en', input.target, {
            providerId: input.providerId,
            onTranslated: async (sourceText, translatedText) => {
              await input.onTranslatedLeaf?.(sourceText, translatedText, leaf.path);
            },
          });
          trByLeafIndex.set(j.leafIndex, tr);
          requestAttempts += tr.runtime?.attempts ?? 1;
          retriesMade += tr.runtime?.retries ?? 0;
          successfulLeaves += 1;
          if (tr.decision === 'review') markedForReview += 1;
          markLeafDone(j.leafIndex);
        }
      } else {
        const poolTotal = jobs.length;
        await mapWithConcurrencyWithProgress(
          jobs,
          maxParallel,
          async (j) => {
            const tr = await translateLeaf(input.provider, j.value, 'en', input.target, {
              providerId: input.providerId,
            });
            trByLeafIndex.set(j.leafIndex, tr);
            requestAttempts += tr.runtime?.attempts ?? 1;
            retriesMade += tr.runtime?.retries ?? 0;
            successfulLeaves += 1;
            if (tr.decision === 'review') markedForReview += 1;
            return j;
          },
          (pool) => {
            const primary =
              pool.activeBySlot[0]?.path ??
              pool.activeBySlot[pool.activeBySlot.length - 1]?.path ??
              '(translate pool)';
            input.tickProgress(pool.completed, poolTotal, primary, {
              phase: 'parallel_pool',
              pool,
            });
          },
          (j) => j.path,
          input.rateLimit,
        );
        for (const j of jobs) {
          const leaf = input.tLeaves[j.leafIndex]!;
          const tr = trByLeafIndex.get(j.leafIndex)!;
          await input.onTranslatedLeaf?.(leaf.value, tr.text, leaf.path);
          markLeafDone(j.leafIndex);
        }
      }

      for (const j of jobs) {
        const tr = trByLeafIndex.get(j.leafIndex)!;
        const node = localeJsonValueFromTranslation(input.persistStructuredLeafMetadata, tr);
        next = setAtPath(next, j.path, node);
        changed += 1;
      }
    }
  } catch (e) {
    next = applyCompletedFillJobs({
      next,
      jobs,
      trByLeafIndex,
      persistStructuredLeafMetadata: input.persistStructuredLeafMetadata,
    });
    throw new TranslateRunInterruptedError({
      cause: e,
      partialLocaleJson: next,
      translateStats: {
        requestAttempts,
        retriesMade,
        successfulLeaves,
        failedRequests: Math.max(0, requestAttempts - successfulLeaves),
      },
    });
  }

  return {
    next,
    changed,
    translateStats: {
      requestAttempts,
      retriesMade,
      successfulLeaves,
      failedRequests: Math.max(0, requestAttempts - successfulLeaves),
    },
    markedForReview,
  };
}
