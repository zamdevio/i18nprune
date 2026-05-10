import { collectStringLeaves, getAtPath, setAtPath } from '../shared/json/index.js';
import { isParityExcluded } from '../policies/parity.js';
import { isPreservePath } from '../policies/preserve.js';
import { localeJsonValueFromTranslation, translateLeaf } from '../shared/translator/index.js';
import { localePathLooksTranslatedFromSource } from '../shared/translator/localePathTranslated.js';
import { mapWithConcurrencyWithProgressOrderedSequential } from '../shared/translator/utils/orchestration.js';
import { TranslateRunInterruptedError } from '../translator/errors/interrupted.js';
import type { TranslationResult } from '../types/translator/result.js';
import type { StringLeaf } from '../types/json/index.js';
import type { ParityPolicy, PreservePolicy } from '../types/policies/index.js';
import type { Translator } from '../types/translator/index.js';
import type { TranslationProviderId } from '../types/translator/providers.js';
import type { TranslationTickProgressFn } from '../types/progress/index.js';
import type { TranslateStartRateLimit } from '../types/translator/rateLimit.js';

type GenerateLeafRow =
  | { k: 'preserve' }
  | { k: 'parity' }
  | { k: 'dry' }
  | { k: 'existing_manual' }
  /** Source string leaf is whitespace-only — copy without **`translateLeaf`** (see **`i18nprune.generate.source_empty_string_leaves`**). */
  | { k: 'empty_copy' }
  /** Completed by an earlier provider attempt — keep path when fallback resumes (see **`TranslateRunInterruptedError`**). */
  | { k: 'resume_prior' }
  | { k: 'translate' };

/**
 * Walk source leaves: preserve / parity rules, then translate or copy into `working` object.
 * Callers supply `Translator`, policies, and progress hooks (CLI wires TTY / `run.progress` here).
 */
export async function buildTranslatedLocaleFromSourceLeaves(input: {
  sourceLeaves: readonly StringLeaf[];
  working: unknown;
  existingRaw: unknown | null;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
  dryRun: boolean;
  force: boolean;
  provider: Translator;
  /** When true, write `{ value, status, … }` leaves using merged {@link translateLeaf} metadata. */
  persistStructuredLeafMetadata: boolean;
  providerId: TranslationProviderId;
  targetLang: string;
  /** Max in-flight **`translateLeaf`** calls; **1** keeps serial semantics (default). */
  maxParallelTranslates?: number;
  rateLimit?: TranslateStartRateLimit;
  tickProgress: TranslationTickProgressFn;
  onTranslatedLeaf?: (sourceText: string, translatedText: string, path: string) => Promise<void> | void;
}): Promise<{
  working: unknown;
  preserveCount: number;
  paritySkip: number;
  /** Leaf paths whose source **value** was whitespace-only — copied without calling the translator. */
  emptySourceLeafPaths: readonly string[];
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
  const rows: GenerateLeafRow[] = [];
  const emptySourceLeafPaths: string[] = [];
  for (const leaf of input.sourceLeaves) {
    if (isPreservePath(leaf.path, input.preserve)) {
      rows.push({ k: 'preserve' });
      continue;
    }
    if (isParityExcluded(leaf.path, leaf.value, input.parity)) {
      rows.push({ k: 'parity' });
      continue;
    }
    const sourceEmpty = leaf.value.trim() === '';
    if (sourceEmpty) {
      emptySourceLeafPaths.push(leaf.path);
    }
    if (input.dryRun) {
      rows.push({ k: 'dry' });
      continue;
    }
    if (input.existingRaw && !input.force && typeof input.existingRaw === 'object') {
      const cur = getAtPath(input.existingRaw, leaf.path);
      if (typeof cur === 'string' && cur !== leaf.value) {
        rows.push({ k: 'existing_manual' });
        continue;
      }
      if (sourceEmpty) {
        rows.push({ k: 'empty_copy' });
        continue;
      }
      if (
        localePathLooksTranslatedFromSource(input.working, leaf.path, leaf.value)
      ) {
        rows.push({ k: 'resume_prior' });
        continue;
      }
      rows.push({ k: 'translate' });
      continue;
    }
    if (sourceEmpty) {
      rows.push({ k: 'empty_copy' });
      continue;
    }
    if (localePathLooksTranslatedFromSource(input.working, leaf.path, leaf.value)) {
      rows.push({ k: 'resume_prior' });
      continue;
    }
    rows.push({ k: 'translate' });
  }

  const translateIndices = rows
    .map((r, idx) => (r.k === 'translate' ? idx : -1))
    .filter((idx): idx is number => idx >= 0);

  const trByLeafIndex = new Map<number, TranslationResult>();
  const total = input.sourceLeaves.length;
  let working = input.working;
  let preserveCount = 0;
  let paritySkip = 0;
  let wal = 0;
  let requestAttempts = 0;
  let retriesMade = 0;
  let successfulLeaves = 0;
  let markedForReview = 0;

  const tick = (leafIndex: number, path: string): void => {
    input.tickProgress(leafIndex + 1, total, path);
  };

  const tryAdvance = (): void => {
    while (wal < total) {
      const leaf = input.sourceLeaves[wal]!;
      const row = rows[wal]!;
      if (row.k === 'preserve') {
        working = setAtPath(working, leaf.path, leaf.value);
        preserveCount += 1;
        tick(wal, leaf.path);
        wal += 1;
        continue;
      }
      if (row.k === 'parity') {
        const cur =
          input.existingRaw && typeof input.existingRaw === 'object'
            ? getAtPath(input.existingRaw, leaf.path)
            : undefined;
        const v = typeof cur === 'string' ? cur : leaf.value;
        working = setAtPath(working, leaf.path, v);
        paritySkip += 1;
        tick(wal, leaf.path);
        wal += 1;
        continue;
      }
      if (row.k === 'dry') {
        const nextNode = localeJsonValueFromTranslation(input.persistStructuredLeafMetadata, {
          text: leaf.value,
          leafMeta: {
            status: 'pending',
            confidence: null,
            needsReview: false,
            needsTranslationAgain: false,
            source: 'manual',
          },
        });
        working = setAtPath(working, leaf.path, nextNode);
        tick(wal, leaf.path);
        wal += 1;
        continue;
      }
      if (row.k === 'existing_manual') {
        const cur = getAtPath(input.existingRaw as object, leaf.path) as string;
        const nextNode = localeJsonValueFromTranslation(input.persistStructuredLeafMetadata, {
          text: cur,
          leafMeta: {
            status: 'translated',
            confidence: null,
            needsReview: false,
            needsTranslationAgain: false,
            source: 'manual',
          },
        });
        working = setAtPath(working, leaf.path, nextNode);
        tick(wal, leaf.path);
        wal += 1;
        continue;
      }
      if (row.k === 'empty_copy') {
        const nextNode = localeJsonValueFromTranslation(input.persistStructuredLeafMetadata, {
          text: leaf.value,
          leafMeta: {
            status: 'translated',
            confidence: null,
            needsReview: true,
            needsTranslationAgain: false,
            source: 'generated',
          },
        });
        working = setAtPath(working, leaf.path, nextNode);
        tick(wal, leaf.path);
        wal += 1;
        continue;
      }
      if (row.k === 'resume_prior') {
        const cur = getAtPath(working as object, leaf.path);
        working = setAtPath(working, leaf.path, cur === undefined ? leaf.value : cur);
        tick(wal, leaf.path);
        wal += 1;
        continue;
      }
      const tr = trByLeafIndex.get(wal);
      if (!tr) break;
      const nextNode = localeJsonValueFromTranslation(input.persistStructuredLeafMetadata, tr);
      working = setAtPath(working, leaf.path, nextNode);
      tick(wal, leaf.path);
      wal += 1;
    }
  };

  tryAdvance();

  try {
    if (translateIndices.length > 0) {
      if (maxParallel <= 1) {
        for (const idx of translateIndices) {
          const leaf = input.sourceLeaves[idx]!;
          await waitForRateWindow();
          const tr = await translateLeaf(input.provider, leaf.value, 'en', input.targetLang, {
            providerId: input.providerId,
            onTranslated: async (sourceText, translatedText) => {
              await input.onTranslatedLeaf?.(sourceText, translatedText, leaf.path);
            },
          });
          trByLeafIndex.set(idx, tr);
          requestAttempts += tr.runtime?.attempts ?? 1;
          retriesMade += tr.runtime?.retries ?? 0;
          successfulLeaves += 1;
          if (tr.decision === 'review') markedForReview += 1;
          tryAdvance();
        }
      } else {
        const poolTotal = translateIndices.length;
        await mapWithConcurrencyWithProgressOrderedSequential(
          translateIndices,
          maxParallel,
          async (idx) => {
            const leaf = input.sourceLeaves[idx]!;
            return await translateLeaf(input.provider, leaf.value, 'en', input.targetLang, {
              providerId: input.providerId,
            });
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
          (leafSourceIdx, _ordInTranslateList) => input.sourceLeaves[leafSourceIdx]!.path,
          async (leafSourceIndex, _poolOrd, tr) => {
            trByLeafIndex.set(leafSourceIndex, tr);
            requestAttempts += tr.runtime?.attempts ?? 1;
            retriesMade += tr.runtime?.retries ?? 0;
            successfulLeaves += 1;
            if (tr.decision === 'review') markedForReview += 1;
            const leaf = input.sourceLeaves[leafSourceIndex]!;
            await input.onTranslatedLeaf?.(leaf.value, tr.text, leaf.path);
            tryAdvance();
          },
          input.rateLimit,
        );
      }
    }

    while (wal < total) {
      tryAdvance();
    }
  } catch (e) {
    throw new TranslateRunInterruptedError({
      cause: e,
      partialLocaleJson: working,
      translateStats: {
        requestAttempts,
        retriesMade,
        successfulLeaves,
        failedRequests: Math.max(0, requestAttempts - successfulLeaves),
      },
    });
  }

  return {
    working,
    preserveCount,
    paritySkip,
    emptySourceLeafPaths,
    translateStats: {
      requestAttempts,
      retriesMade,
      successfulLeaves,
      failedRequests: Math.max(0, requestAttempts - successfulLeaves),
    },
    markedForReview,
  };
}

/** Re-scan paths that still exist after deletes (cleanup helper). */
export function localeJsonHasKeyPath(data: unknown, keyPath: string): boolean {
  return collectStringLeaves(data).some((l) => l.path === keyPath);
}
