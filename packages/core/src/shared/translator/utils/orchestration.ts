/**
 * Parallel translation scheduling for **`generate`** / **`fill`**.
 * **`translateLeaf`** stays a single-leaf primitive; this module pools **`translateLeaf`** calls with a bounded concurrency.
 *
 * Roadmap: **`maintainer/phases/providers.md`** → *Concurrency & orchestration*.
 */


import type { TranslationProviderId } from '../../../types/translator/providers.js';
import type { TranslationPoolProgressSnapshot } from '../../../types/progress/tick.js';
import type { ProviderRateLimitRegistry, TranslateStartRateLimit } from '../../../types/translator/rateLimit.js';
import { TRANSLATE_WORKERS_CAP } from '../../constants/translate.js';

/** One leaf translation job for a future worker pool. */
export type TranslateLeafJob = {
  readonly path: string;
  readonly sourceText: string;
  readonly sourceLang: string;
  readonly targetLang: string;
};

/** Resolved caps for worker scheduling (config + CLI override). */
export type TranslateOrchestrationLimits = {
  readonly minWorkers: number;
  readonly maxWorkers: number;
  /** Optional ordered pool when `translate.policy.routing` is **`auto`** (future). */
  readonly providerPool?: readonly TranslationProviderId[];
};

export { TRANSLATE_WORKERS_CAP } from '../../constants/translate.js';

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.trunc(n)));
}

/** Conservative per-provider defaults when config omits explicit throttle values. */
export const DEFAULT_PROVIDER_RATE_LIMITS: ProviderRateLimitRegistry = {
  // Google can sustain higher throughput; default to safe-high (32) while allowing user/config up to 64.
  google: { maxConcurrency: 32, rpm: 1920, rps: 32, intervalMs: 32 },
  mymemory: { maxConcurrency: 2, rpm: 60, rps: 1, intervalMs: 1000 },
  libre: { maxConcurrency: 6, rpm: 120, rps: 2, intervalMs: 500 },
  deepl: { maxConcurrency: 4, rpm: 90, rps: 1.5, intervalMs: 600 },
  llm: { maxConcurrency: 2, rpm: 30, rps: 0.5, intervalMs: 1500 },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveStartGapMs(limits: TranslateStartRateLimit | undefined): number {
  if (!limits) return 0;
  const fromRpm = typeof limits.rpm === 'number' && limits.rpm > 0 ? 60_000 / limits.rpm : 0;
  const fromRps = typeof limits.rps === 'number' && limits.rps > 0 ? 1_000 / limits.rps : 0;
  const fromMin = typeof limits.intervalMs === 'number' && limits.intervalMs >= 0 ? limits.intervalMs : 0;
  return Math.max(fromRpm, fromRps, fromMin);
}

function createStartRateGate(limits: TranslateStartRateLimit | undefined): () => Promise<void> {
  const gapMs = resolveStartGapMs(limits);
  if (!(gapMs > 0)) return async () => {};
  let queueTail: Promise<void> = Promise.resolve();
  let nextAllowedStart = 0;
  return async () => {
    const prev = queueTail;
    let releaseCurrent!: () => void;
    queueTail = new Promise<void>((resolve) => {
      releaseCurrent = resolve;
    });
    await prev;
    const now = Date.now();
    const waitMs = Math.max(0, nextAllowedStart - now);
    if (waitMs > 0) await sleep(waitMs);
    const startedAt = Date.now();
    nextAllowedStart = startedAt + gapMs;
    releaseCurrent();
  };
}

/**
 * Run **`mapper`** over **`items`** with at most **`concurrency`** in-flight promises.
 * Results are ordered like **`items`**.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const cap = clampInt(concurrency, 1, TRANSLATE_WORKERS_CAP);
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await mapper(items[i]!, i);
    }
  }

  const pool = Math.min(cap, Math.max(1, items.length));
  await Promise.all(Array.from({ length: pool }, () => worker()));
  return results;
}

/**
 * Like {@link mapWithConcurrency}, but emits **`onProgress`** whenever a slot starts or finishes work
 * so UIs can show honest in-flight paths + **`completed` / `total`** for the pool.
 */
export async function mapWithConcurrencyWithProgress<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, itemIndex: number) => Promise<R>,
  onProgress: (snap: TranslationPoolProgressSnapshot) => void,
  getPath: (item: T, itemIndex: number) => string,
  rateLimit?: TranslateStartRateLimit,
): Promise<R[]> {
  const n = items.length;
  if (n === 0) return [];

  const cap = clampInt(concurrency, 1, TRANSLATE_WORKERS_CAP);
  const poolSize = Math.min(cap, n);
  const results: R[] = new Array(n);
  let nextIndex = 0;
  let completed = 0;
  let poolFailure: unknown;
  const activeItemIndex = new Array<number>(poolSize).fill(-1);
  const waitForStartTurn = createStartRateGate(rateLimit);

  const snapshot = (): TranslationPoolProgressSnapshot => {
    const activeBySlot: { slot: number; path: string }[] = [];
    for (let slot = 0; slot < poolSize; slot += 1) {
      const ii = activeItemIndex[slot]!;
      if (ii >= 0) {
        activeBySlot.push({ slot, path: getPath(items[ii]!, ii) });
      }
    }
    return { completed, total: n, activeBySlot };
  };

  async function runSlot(slot: number): Promise<void> {
    while (true) {
      if (poolFailure !== undefined) {
        activeItemIndex[slot] = -1;
        return;
      }
      const i = nextIndex;
      nextIndex += 1;
      if (i >= n) {
        activeItemIndex[slot] = -1;
        if (poolFailure === undefined) onProgress(snapshot());
        return;
      }
      activeItemIndex[slot] = i;
      if (poolFailure === undefined) onProgress(snapshot());
      try {
        await waitForStartTurn();
        results[i] = await mapper(items[i]!, i);
        completed += 1;
      } catch (e) {
        poolFailure ??= e;
      } finally {
        activeItemIndex[slot] = -1;
        if (poolFailure === undefined) onProgress(snapshot());
      }
    }
  }

  await Promise.allSettled(Array.from({ length: poolSize }, (_, slot) => runSlot(slot)));
  if (poolFailure !== undefined) throw poolFailure;
  return results;
}

/**
 * Parallel **`run`** with the same progress snapshots as {@link mapWithConcurrencyWithProgress},
 * but **`onSequential`** runs **in strict item order** (0…n-1) and is **awaited** before the
 * sliding window advances. Use this when hosts need **per-item** async side effects (e.g. identity
 * streak prompts) **without** waiting for the entire pool to finish.
 *
 * Scheduling invariant: job at position **`p`** starts only if **`p < nextEmit + poolSize`**, so at
 * most **`poolSize`** jobs run ahead of sequential consumption — same overlap as sequential replay
 * after a full pool.
 */
export async function mapWithConcurrencyWithProgressOrderedSequential<TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  run: (item: TItem, itemIndex: number) => Promise<TResult>,
  onProgress: (snap: TranslationPoolProgressSnapshot) => void,
  getPath: (item: TItem, itemIndex: number) => string,
  onSequential: (item: TItem, itemIndex: number, result: TResult) => Promise<void> | void,
  rateLimit?: TranslateStartRateLimit,
): Promise<void> {
  const n = items.length;
  if (n === 0) return;

  const cap = clampInt(concurrency, 1, TRANSLATE_WORKERS_CAP);
  const poolSize = Math.min(cap, n);
  const results: Array<TResult | undefined> = new Array(n);
  const inFlightByPos = new Array<boolean>(n).fill(false);

  let nextEmit = 0;
  /** Translate jobs finished successfully (possibly not yet emitted through `onSequential`). */
  let completedJobs = 0;
  let inFlightCount = 0;
  /** First **run()** rejection — avoids counting failed slots as completed (deadlock spin). */
  let poolFailure: unknown;
  const waitForStartTurn = createStartRateGate(rateLimit);

  const snapshot = (): TranslationPoolProgressSnapshot => {
    const activeBySlot: { slot: number; path: string }[] = [];
    let slot = 0;
    for (let pos = 0; pos < n; pos += 1) {
      if (inFlightByPos[pos]) {
        activeBySlot.push({ slot, path: getPath(items[pos]!, pos) });
        slot += 1;
      }
    }
    return { completed: completedJobs, total: n, activeBySlot };
  };

  let flushTail: Promise<void> = Promise.resolve();
  const enqueueFlush = (): void => {
    flushTail = flushTail.then(async () => {
      while (nextEmit < n && results[nextEmit] !== undefined) {
        await onSequential(items[nextEmit]!, nextEmit, results[nextEmit]!);
        nextEmit += 1;
        trySchedule();
      }
    });
  };

  const trySchedule = (): void => {
    if (poolFailure !== undefined) return;
    for (let pos = 0; pos < n && inFlightCount < poolSize; pos += 1) {
      if (results[pos] !== undefined || inFlightByPos[pos]) continue;
      if (pos >= nextEmit + poolSize) continue;
      inFlightByPos[pos] = true;
      inFlightCount += 1;
      void (async (): Promise<void> => {
        try {
          onProgress(snapshot());
          await waitForStartTurn();
          const mapped = await run(items[pos]!, pos);
          if (mapped === undefined) {
            throw new Error(
              `mapWithConcurrencyWithProgressOrderedSequential: mapper returned undefined for index ${String(pos)} (${getPath(items[pos]!, pos)})`,
            );
          }
          results[pos] = mapped;
          completedJobs += 1;
        } catch (e) {
          poolFailure ??= e;
        } finally {
          inFlightByPos[pos] = false;
          inFlightCount -= 1;
          if (poolFailure === undefined) {
            onProgress(snapshot());
          }
          enqueueFlush();
        }
      })();
    }
  };

  trySchedule();

  /**
   * Count iterations only when **no** mapper promise is in flight but we still owe sequential emits.
   * When `inFlightCount > 0`, slow network/API work is expected — the old global spin cap fired in **seconds**
   * because each `setImmediate` tick is cheap (false "deadlock" with healthy parallel workers).
   */
  let idleSchedulerSpins = 0;
  while (nextEmit < n || inFlightCount > 0) {
    if (poolFailure !== undefined && inFlightCount === 0) break;
    if (inFlightCount === 0 && nextEmit < n) {
      idleSchedulerSpins += 1;
      if (idleSchedulerSpins > 250_000) {
        const hole = results.findIndex((r) => r === undefined);
        throw new Error(
          `mapWithConcurrencyWithProgressOrderedSequential: stalled (scheduling deadlock — no in-flight work but sequential drain did not advance) · nextEmit=${String(nextEmit)} total=${String(n)} completedJobs=${String(completedJobs)} firstMissingResultIndex=${String(hole)}`,
        );
      }
    } else {
      idleSchedulerSpins = 0;
    }
    await flushTail;
    trySchedule();
    if (nextEmit >= n && inFlightCount === 0) break;
    await new Promise<void>((r) => setImmediate(r));
  }

  try {
    await flushTail;
  } catch (e) {
    poolFailure ??= e;
  }

  if (poolFailure !== undefined) {
    throw poolFailure;
  }

  if (nextEmit !== n) {
    throw new Error('mapWithConcurrencyWithProgressOrderedSequential: drain did not consume all jobs');
  }
}

export type ResolveTranslateMaxParallelInput = {
  /** From **`translate.workers`** (**`1`** when omitted). */
  configMaxWorkers?: number;
  /** CLI **`--workers`**. */
  workersFlag?: number;
  /** Raw **`I18NPRUNE_TRANSLATE_MAX_WORKERS`** string. */
  envMaxWorkers?: string;
};

function parseEnvPositiveInt(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

/**
 * Effective max parallel **`translateLeaf`** calls: defaults to **1** (serial).
 * Precedence: **`--workers`** → **`I18NPRUNE_TRANSLATE_MAX_WORKERS`** → **`translate.workers`** (**number**) → **1**.
 */
export function resolveTranslateMaxParallel(input: ResolveTranslateMaxParallelInput): number {
  let n = input.configMaxWorkers ?? 1;
  const env = parseEnvPositiveInt(input.envMaxWorkers);
  if (env !== undefined) n = env;
  if (input.workersFlag !== undefined) n = input.workersFlag;
  return clampInt(n, 1, TRANSLATE_WORKERS_CAP);
}
