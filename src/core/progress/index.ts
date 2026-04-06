import { getRunOptions } from '@/core/runtime/options.js';
import { createRichTranslationProgress } from '@/core/progress/translation.js';
import type { TranslationProgress } from '@/types/core/progress/index.js';
import { canPrintProgress } from '@/utils/logger/policy.js';

export type { ProgressCallbacks, TranslationProgress } from '@/types/core/progress/index.js';
export { formatDurationMs, truncateMiddle } from '@/core/progress/format.js';

/**
 * Live translation progress on **stderr** (multi-line bar + key + timing on TTY; single-line fallback otherwise).
 * Respects **`canPrintProgress`**: no UI when **`--json`**, **`-q`**, **`-s`**, or combined opts from session.
 */
export function createTranslationProgress(opts: {
  quiet?: boolean;
  json?: boolean;
}): TranslationProgress {
  const run = getRunOptions();
  const noProgress =
    !canPrintProgress(run) || Boolean(opts.json || opts.quiet || run.json);
  if (noProgress) {
    return {
      quiet: true,
      tick() {},
      done() {},
      fail() {},
    };
  }
  return createRichTranslationProgress();
}
