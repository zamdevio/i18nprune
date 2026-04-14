import { attachStdinDiscardDuringProgress } from '@/core/terminal/stdin-discard-while-raw.js';
import { forceShowCursor } from '@/core/terminal/cursor.js';
import { createTranslationProgress } from '@/core/progress/index.js';
import type { SessionProgressOptions } from '@/types/core/progress/index.js';

export type { SessionProgressOptions };

/** Session with stdin discard + progress line for long generate/fill runs. */
export function createSessionProgress(opts: SessionProgressOptions) {
  const detachStdin = attachStdinDiscardDuringProgress();
  const progress = createTranslationProgress(opts);

  const onSigInt = (): void => {
    forceShowCursor();
    detachStdin();
    process.exit(130);
  };
  process.once('SIGINT', onSigInt);

  return {
    progress,
    finish(): void {
      process.removeListener('SIGINT', onSigInt);
      detachStdin();
      progress.done();
    },
    fail(): void {
      process.removeListener('SIGINT', onSigInt);
      detachStdin();
      progress.fail();
    },
  };
}
