import type { RunOptions } from '@i18nprune/core';

/** Which output gate applies (`canPrint*` / `canEmit`). */
export type LogGate =
  | 'info'
  | 'notice'
  | 'warn'
  | 'detail'
  | 'primary'
  | 'decorative'
  | 'banner'
  | 'progress'
  | 'cache'
  | 'scan'
  | 'verbose'
  | 'tip';

/** Per-call merge on top of resolved `RunOptions`. */
export type LoggerMask = Partial<RunOptions>;
