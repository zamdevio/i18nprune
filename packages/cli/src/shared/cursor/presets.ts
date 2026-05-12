/**
 * Default **CSI A** row counts for **`up()`** (`lift.ts`). Matches translation progress height
 * (bar + keys + footer) so the next stderr log line clears cleanly.
 */
import type { LiftRows } from '@/types/shared/cursor/index.js';

/** Before provider handoff warns and translate-failure **`logger.err`** (429 / network). */
export const gap: LiftRows = 4;
