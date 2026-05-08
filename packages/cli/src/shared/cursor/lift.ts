import type { RunOptions } from '@/types/core/runtime/index.js';
import type { LiftRows } from '@/types/shared/cursor/index.js';
import { canPrintProgress } from '@/utils/logger/policy.js';

const MAX_ROWS = 8;

/**
 * Whether stderr cursor reclaim is allowed for this run: same gate as **`createTranslationProgress`**
 * (not `--json` / `--quiet` / `--silent`) **and** stderr is a TTY.
 */
export function eligible(run: RunOptions): boolean {
  return canPrintProgress(run) && Boolean(process.stderr.isTTY);
}

/**
 * Raw VT cursor-up on **stderr** (no run policy). Clamps to **1…{@link MAX_ROWS}**.
 * Prefer {@link up} so `--json` / CI never move the cursor.
 */
export function rawUp(rows: LiftRows): void {
  if (!process.stderr.isTTY) return;
  if (!Number.isFinite(rows) || rows <= 0) return;
  const n = Math.max(1, Math.min(MAX_ROWS, Math.trunc(rows)));
  process.stderr.write(`\x1b[${String(n)}A`);
  process.stderr.write('\r');
}

/**
 * {@link rawUp} only when {@link eligible} — use after the progress block is cleared and before
 * the next human-facing stderr line.
 */
export function up(run: RunOptions, rows: LiftRows): void {
  if (!eligible(run)) return;
  rawUp(rows);
}
