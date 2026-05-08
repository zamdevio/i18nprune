/**
 * Default **CSI A** row counts for **`up()`** (`lift.ts`). Matches translation progress height
 * (bar + keys + footer) so the next stderr log line clears cleanly.
 */
import type { LiftRows } from '@/types/shared/cursor/index.js';

/** After **`session.finish`** — progress completed successfully. */
export const done: LiftRows = 2;

/** After **`session.fail`** — progress aborted; extra room before summaries/errors. */
export const fail: LiftRows = 4;

/** Before provider handoff warns and translate-failure **`logger.err`** (429 / network). */
export const gap: LiftRows = 4;
