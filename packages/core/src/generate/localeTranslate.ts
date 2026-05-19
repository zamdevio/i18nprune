import { getAtPath, setAtPath } from '../shared/json/index.js';
import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { isParityExcluded } from '../policies/parity.js';
import { isPreservePath } from '../policies/preserve.js';
import { localeJsonValueFromTranslation } from '../shared/translator/index.js';
import { localePathLooksTranslatedFromSource } from '../shared/translator/localePathTranslated.js';
import type { GenerateTranslateCache } from '../types/translator/cache.js';
import { translateLeafWithGenerateCache } from '../translator/cache/index.js';
import { runTranslateLeafPoolOrderedSequential } from '../shared/translator/utils/translateLeafPoolOrderedSequential.js';
import { TranslateRunInterruptedError } from '../translator/errors/interrupted.js';
import { isResumeCandidateLeaf } from './resume/eligibleResumeLeaves.js';
import type { TranslationResult } from '../types/translator/result.js';
import type { StringLeaf } from '../types/json/index.js';
import type { ParityPolicy, PreservePolicy } from '../types/policies/index.js';
import type { Translator } from '../types/translator/index.js';
import type { TranslationProviderId } from '../types/translator/providers.js';
import type { TranslationTickProgressFn } from '../types/progress/index.js';
import type { TranslateStartRateLimit } from '../types/translator/rateLimit.js';
import type { TranslationSurfaceLeaf } from '../types/locales/leaves/index.js';
import type { EffectiveReferenceConfig } from '../types/reference/index.js';
import type { GenerateResumeRefContext } from '../types/generate/resumeCandidates.js';
import type { TranslateCacheHitLayer } from '../types/translator/cache.js';
import type { TranslateRunPartialStats } from '../types/translator/runStats.js';

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

/** One network **`translateLeaf`** job in stable order (full generate uses source index as **`key`**; resume uses review **`leafIndex`**). */
type OrderedTranslateStringJob<TKey extends number | string = number> = {
  readonly key: TKey;
  readonly path: string;
  readonly value: string;
};

function createTranslateRateWindowLimiter(rateLimit?: TranslateStartRateLimit): () => Promise<void> {
  const gapMs = Math.max(
    rateLimit?.intervalMs ?? 0,
    rateLimit?.rpm && rateLimit.rpm > 0 ? 60_000 / rateLimit.rpm : 0,
    rateLimit?.rps && rateLimit.rps > 0 ? 1_000 / rateLimit.rps : 0,
  );
  let nextAllowedStart = 0;
  return async (): Promise<void> => {
    if (!(gapMs > 0)) return;
    const now = Date.now();
    const waitMs = Math.max(0, nextAllowedStart - now);
    if (waitMs > 0) await new Promise<void>((r) => setTimeout(r, waitMs));
    nextAllowedStart = Date.now() + gapMs;
  };
}

/**
 * Shared **`generate`** / **`generate --resume`** translation pool: serial vs ordered-parallel
 * **`translateLeaf`**, same **`onTranslatedLeaf`** timing, rate window, and stats aggregation.
 */
async function runOrderedTranslateStringJobs<TKey extends number | string>(input: {
  jobs: readonly OrderedTranslateStringJob<TKey>[];
  /** Mutated as each leaf completes so callers (e.g. **`tryAdvance`**) see results immediately in serial mode. */
  trByKey: Map<TKey, TranslationResult>;
  maxParallel: number;
  rateLimit?: TranslateStartRateLimit;
  provider: Translator;
  providerId: TranslationProviderId;
  sourceLang: string;
  targetLang: string;
  translationCache?: GenerateTranslateCache;
  tickProgress: TranslationTickProgressFn;
  onTranslatedLeaf?: (sourceText: string, translatedText: string, path: string) => Promise<void> | void;
  /** After each serial **`translateLeaf`** (e.g. full-generate **`tryAdvance`** or resume bar tick). */
  afterEachSerial?: (ctx: { jobIndex: number; job: OrderedTranslateStringJob<TKey> }) => Promise<void> | void;
  /** After each ordered parallel drain step (e.g. full-generate **`tryAdvance`**). */
  afterEachParallelSequential?: () => Promise<void> | void;
}): Promise<{
  requestAttempts: number;
  retriesMade: number;
  successfulLeaves: number;
  markedForReview: number;
  cacheHits: number;
}> {
  const { trByKey } = input;
  let requestAttempts = 0;
  let retriesMade = 0;
  let successfulLeaves = 0;
  let markedForReview = 0;
  let cacheHits = 0;
  const record = (tr: TranslationResult, cacheHit: TranslateCacheHitLayer): void => {
    if (cacheHit !== false) {
      cacheHits += 1;
    } else {
      requestAttempts += tr.runtime?.attempts ?? 1;
      retriesMade += tr.runtime?.retries ?? 0;
    }
    successfulLeaves += 1;
    if (tr.decision === 'review') markedForReview += 1;
  };

  const translateJob = async (
    job: OrderedTranslateStringJob<TKey>,
    onTranslated?: (sourceText: string, translatedText: string) => Promise<void> | void,
  ): Promise<TranslationResult> => {
    const { result, cacheHit } = await translateLeafWithGenerateCache({
      translationCache: input.translationCache,
      provider: input.provider,
      sourceText: job.value,
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      providerId: input.providerId,
      onTranslated,
    });
    record(result, cacheHit);
    return result;
  };

  if (input.jobs.length === 0) {
    return { requestAttempts, retriesMade, successfulLeaves, markedForReview, cacheHits };
  }

  const waitForRateWindow = createTranslateRateWindowLimiter(input.rateLimit);
  const maxParallel = Math.max(1, Math.min(64, Math.floor(input.maxParallel)));

  if (maxParallel <= 1) {
    for (let ji = 0; ji < input.jobs.length; ji++) {
      const job = input.jobs[ji]!;
      await waitForRateWindow();
      const tr = await translateJob(job, async (sourceText, translatedText) => {
        await input.onTranslatedLeaf?.(sourceText, translatedText, job.path);
      });
      trByKey.set(job.key, tr);
      await input.afterEachSerial?.({ jobIndex: ji, job });
    }
  } else {
    const poolTotal = input.jobs.length;
    await runTranslateLeafPoolOrderedSequential({
      items: input.jobs,
      maxParallel,
      rateLimit: input.rateLimit,
      getPath: (j) => j.path,
      translateItem: async (j) =>
        await translateJob(j),
      tickProgress: input.tickProgress,
      poolTotal,
      onSequential: async (j, _ord, tr) => {
        trByKey.set(j.key, tr);
        await input.onTranslatedLeaf?.(j.value, tr.text, j.path);
        await input.afterEachParallelSequential?.();
      },
    });
  }

  return { requestAttempts, retriesMade, successfulLeaves, markedForReview, cacheHits };
}

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
  /** BCP-47-ish source tag passed to **`translateLeaf`** (default **`en`**). */
  sourceLang?: string;
  targetLang: string;
  /** Per-run L1 memo; omitted when host bypassed cache (`--no-cache`). */
  translationCache?: GenerateTranslateCache;
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
  translateStats: TranslateRunPartialStats;
  /** Count of translated leaves classified as review-needed by policy/meta pipeline. */
  markedForReview: number;
}> {
  const maxParallel = Math.max(1, Math.min(64, Math.floor(input.maxParallelTranslates ?? 1)));
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
  let cacheHits = 0;
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
      const jobs: OrderedTranslateStringJob<number>[] = translateIndices.map((idx) => {
        const leaf = input.sourceLeaves[idx]!;
        return { key: idx, path: leaf.path, value: leaf.value };
      });
      const ran = await runOrderedTranslateStringJobs({
        jobs,
        trByKey: trByLeafIndex,
        maxParallel,
        rateLimit: input.rateLimit,
        provider: input.provider,
        providerId: input.providerId,
        sourceLang: input.sourceLang ?? 'en',
        targetLang: input.targetLang,
        translationCache: input.translationCache,
        tickProgress: input.tickProgress,
        onTranslatedLeaf: input.onTranslatedLeaf,
        afterEachSerial: async () => {
          tryAdvance();
        },
        afterEachParallelSequential: async () => {
          tryAdvance();
        },
      });
      requestAttempts += ran.requestAttempts;
      retriesMade += ran.retriesMade;
      successfulLeaves += ran.successfulLeaves;
      markedForReview += ran.markedForReview;
      cacheHits += ran.cacheHits;
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
        cacheHits,
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
      cacheHits,
    },
    markedForReview,
  };
}

/** Re-scan paths that still exist after deletes (cleanup helper). */
export function localeJsonHasKeyPath(data: unknown, keyPath: string): boolean {
  return collectTranslationSurfaceLeaves(data).some((l) => l.path === keyPath);
}

// --- `generate --resume` (same translation orchestration as full generate via **`runOrderedTranslateStringJobs`**) ---

export type ResumeTranslationJob = { leafIndex: number; path: string; value: string };

export type ListResumeTranslationJobsInput = {
  tLeaves: readonly TranslationSurfaceLeaf[];
  next: unknown;
  sourceMap: Map<string, string>;
  refCtx: GenerateResumeRefContext;
  eff: EffectiveReferenceConfig;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
  dryRun: boolean;
};

/**
 * Classify review leaves into network translation jobs (used for **`generate --resume`** progress totals
 * and orchestration). Skipped leaves (non-candidates, already translated) are omitted.
 */
export function listResumeTranslationJobs(input: ListResumeTranslationJobsInput): {
  jobs: ResumeTranslationJob[];
  dryRunCandidateCount: number;
} {
  const jobs: ResumeTranslationJob[] = [];
  let dryRunCandidateCount = 0;
  for (let i = 0; i < input.tLeaves.length; i++) {
    const leaf = input.tLeaves[i]!;
    if (
      !isResumeCandidateLeaf({
        leaf,
        sourceMap: input.sourceMap,
        refCtx: input.refCtx,
        eff: input.eff,
        preserve: input.preserve,
        parity: input.parity,
      })
    ) {
      continue;
    }
    if (input.dryRun) {
      dryRunCandidateCount += 1;
      continue;
    }
    if (localePathLooksTranslatedFromSource(input.next, leaf.path, leaf.value)) {
      continue;
    }
    jobs.push({ leafIndex: i, path: leaf.path, value: leaf.value });
  }
  return { jobs, dryRunCandidateCount };
}

function applyCompletedResumeJobs(input: {
  next: unknown;
  jobs: readonly ResumeTranslationJob[];
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
 * **`generate --resume`**: walk review leaves, translate candidates that still match source, update JSON.
 */
export async function translateResumeCandidateLeaves(input: {
  tLeaves: readonly TranslationSurfaceLeaf[];
  next: unknown;
  sourceMap: Map<string, string>;
  refCtx: GenerateResumeRefContext;
  eff: EffectiveReferenceConfig;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
  provider: Translator;
  providerId: TranslationProviderId;
  /** BCP-47-ish source tag passed to **`translateLeaf`** (default **`en`**). */
  sourceLang?: string;
  persistStructuredLeafMetadata: boolean;
  target: string;
  dryRun: boolean;
  maxParallelTranslates?: number;
  rateLimit?: TranslateStartRateLimit;
  /** Per-run L1 memo; omitted when host bypassed cache (`--no-cache`). */
  translationCache?: GenerateTranslateCache;
  tickProgress: TranslationTickProgressFn;
  onTranslatedLeaf?: (sourceText: string, translatedText: string, path: string) => Promise<void> | void;
}): Promise<{
  next: unknown;
  changed: number;
  translateStats: TranslateRunPartialStats;
  markedForReview: number;
}> {
  const maxParallel = Math.max(1, Math.min(64, Math.floor(input.maxParallelTranslates ?? 1)));
  let next = input.next;
  let changed = 0;

  const { jobs, dryRunCandidateCount } = listResumeTranslationJobs({
    tLeaves: input.tLeaves,
    next: input.next,
    sourceMap: input.sourceMap,
    refCtx: input.refCtx,
    eff: input.eff,
    preserve: input.preserve,
    parity: input.parity,
    dryRun: input.dryRun,
  });

  if (input.dryRun) {
    if (dryRunCandidateCount > 0) {
      const barTotal = Math.max(1, dryRunCandidateCount);
      let tickN = 0;
      for (let i = 0; i < input.tLeaves.length; i++) {
        const leaf = input.tLeaves[i]!;
        if (
          !isResumeCandidateLeaf({
            leaf,
            sourceMap: input.sourceMap,
            refCtx: input.refCtx,
            eff: input.eff,
            preserve: input.preserve,
            parity: input.parity,
          })
        ) {
          continue;
        }
        tickN += 1;
        changed += 1;
        input.tickProgress(tickN, barTotal, leaf.path);
      }
    }
    return {
      next: input.next,
      changed,
      translateStats: {
        requestAttempts: 0,
        retriesMade: 0,
        successfulLeaves: 0,
        failedRequests: 0,
        cacheHits: 0,
      },
      markedForReview: 0,
    };
  }

  const trByLeafIndex = new Map<number, TranslationResult>();
  let requestAttempts = 0;
  let retriesMade = 0;
  let successfulLeaves = 0;
  let markedForReview = 0;
  let cacheHits = 0;

  try {
    if (jobs.length > 0) {
      const barTotal = Math.max(1, jobs.length);
      const orderedJobs: OrderedTranslateStringJob<number>[] = jobs.map((j) => ({
        key: j.leafIndex,
        path: j.path,
        value: j.value,
      }));
      const ran = await runOrderedTranslateStringJobs({
        jobs: orderedJobs,
        trByKey: trByLeafIndex,
        maxParallel,
        rateLimit: input.rateLimit,
        provider: input.provider,
        providerId: input.providerId,
        sourceLang: input.sourceLang ?? 'en',
        targetLang: input.target,
        translationCache: input.translationCache,
        tickProgress: input.tickProgress,
        onTranslatedLeaf: input.onTranslatedLeaf,
        afterEachSerial: async ({ jobIndex, job }) => {
          input.tickProgress(jobIndex + 1, barTotal, job.path);
        },
      });
      requestAttempts += ran.requestAttempts;
      retriesMade += ran.retriesMade;
      successfulLeaves += ran.successfulLeaves;
      markedForReview += ran.markedForReview;
      cacheHits += ran.cacheHits;

      for (const j of jobs) {
        const tr = trByLeafIndex.get(j.leafIndex)!;
        const node = localeJsonValueFromTranslation(input.persistStructuredLeafMetadata, tr);
        next = setAtPath(next, j.path, node);
        changed += 1;
      }
    }
  } catch (e) {
    next = applyCompletedResumeJobs({
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
        cacheHits,
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
      cacheHits,
    },
    markedForReview,
  };
}
