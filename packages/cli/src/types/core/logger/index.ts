import type { RunOptions } from '@/types/core/runtime/index.js';

/** Which output gate applies (`canPrint*` / `canEmit`). */
export type LogGate =
  | 'info'
  | 'warn'
  | 'detail'
  | 'primary'
  | 'decorative'
  | 'banner'
  | 'progress';

/** Per-call merge on top of resolved `RunOptions`. */
export type LoggerMask = Partial<RunOptions>;
