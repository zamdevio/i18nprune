/**
 * CLI stderr cursor utilities — **block clear / redraw** (`stderrLines`) and **post-bar reclaim** (`lift`).
 *
 * - **`clearStderrLines`** / **`rewindStderrForRedraw`** — generic erase / in-place redraw helpers.
 * - **`eligible`** / **`up`** / **`rawUp`** — reclaim after progress teardown (**`rows`** presets).
 */
export { eligible, rawUp, up } from './lift.js';
export { clearStderrLines, rewindStderrForRedraw } from './stderrLines.js';
export * as rows from './presets.js';
export type { LiftRows, LineCount } from '@/types/shared/cursor/index.js';
