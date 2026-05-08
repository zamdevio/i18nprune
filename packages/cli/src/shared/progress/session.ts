import { getRunOptions } from '@i18nprune/core';
import { rows, up } from '@/shared/cursor/index.js';
import { attachStdinDiscardDuringProgress } from '@/shared/terminal/stdin-discard-while-raw.js';
import { forceShowCursor } from '@/shared/terminal/cursor.js';
import { createTranslationProgress } from './translation.js';
import type { SessionProgressOptions } from '@/types/shared/progress/index.js';

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
      up(getRunOptions(), rows.done);
    },
    fail(): void {
      process.removeListener('SIGINT', onSigInt);
      detachStdin();
      progress.fail();
      // Failures tend to print an error + summary + issues; reclaim a little more vertical space.
      up(getRunOptions(), rows.fail);
    },
  };
}
