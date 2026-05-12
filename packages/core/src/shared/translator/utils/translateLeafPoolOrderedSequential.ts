import type { TranslationResult } from '../../../types/translator/result.js';
import type { TranslationTickProgressFn } from '../../../types/progress/index.js';
import type { TranslateStartRateLimit } from '../../../types/translator/rateLimit.js';
import { mapWithConcurrencyWithProgressOrderedSequential } from './orchestration.js';

/**
 * Bounded parallel **`translateItem`** with **`mapWithConcurrencyWithProgressOrderedSequential`**:
 * same progress snapshots as **`generate`** parallel mode, and **`onSequential`** runs in strict item
 * order (identity streak / host hooks can await between leaves without waiting for the whole pool).
 */
export async function runTranslateLeafPoolOrderedSequential<TItem>(input: {
  readonly items: readonly TItem[];
  maxParallel: number;
  rateLimit?: TranslateStartRateLimit;
  getPath: (item: TItem, itemIndex: number) => string;
  translateItem: (item: TItem, itemIndex: number) => Promise<TranslationResult>;
  tickProgress: TranslationTickProgressFn;
  poolTotal: number;
  onSequential: (item: TItem, itemIndex: number, tr: TranslationResult) => Promise<void> | void;
}): Promise<void> {
  await mapWithConcurrencyWithProgressOrderedSequential(
    input.items,
    input.maxParallel,
    input.translateItem,
    (pool) => {
      const primary =
        pool.activeBySlot[0]?.path ??
        pool.activeBySlot[pool.activeBySlot.length - 1]?.path ??
        '(translate pool)';
      input.tickProgress(pool.completed, input.poolTotal, primary, {
        phase: 'parallel_pool',
        pool,
      });
    },
    input.getPath,
    input.onSequential,
    input.rateLimit,
  );
}
