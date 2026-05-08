import type { TranslationTickProgressOptions } from '../types/progress/tick.js';

/** True when the tick is **pool activity** only (no strict sequential advance). */
export function isTranslationProgressParallelPoolPhase(
  options?: TranslationTickProgressOptions,
): boolean {
  return options?.phase === 'parallel_pool';
}
