import type { LineCount } from '@/types/shared/cursor/index.js';

/**
 * Move to the start of the **current** line, jump **up** `lines` rows, erase each row (**EL** + newline),
 * then **CR**. Cursor ends just below the former block — useful before printing unrelated stderr.
 *
 * Generic **stderr** helper: any CLI multi-line TTY UI can reuse this to wipe its last painted block.
 * No **`RunOptions`** gate (callers already know they are drawing to a TTY).
 */
export function clearStderrLines(lines: LineCount): void {
  if (!process.stderr.isTTY) return;
  const n = Math.trunc(lines);
  if (!Number.isFinite(n) || n <= 0) return;
  process.stderr.write('\r');
  process.stderr.write(`\x1b[${String(n)}A`);
  for (let i = 0; i < n; i += 1) {
    process.stderr.write('\x1b[K\n');
  }
  process.stderr.write('\r');
}

/**
 * Wipe **`lines`** rows (see {@link clearStderrLines}), then move the cursor **back to the first line**
 * of that block so the caller can redraw in place — same pattern as “clear old frame → paint new frame”.
 */
export function rewindStderrForRedraw(lines: LineCount): void {
  if (!process.stderr.isTTY) return;
  const n = Math.trunc(lines);
  if (!Number.isFinite(n) || n <= 0) return;
  clearStderrLines(n);
  process.stderr.write(`\x1b[${String(n)}A`);
  process.stderr.write('\r');
}
