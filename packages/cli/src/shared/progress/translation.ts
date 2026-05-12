import {
  getRunOptions,
  isTranslationProgressParallelPoolPhase,
  type TranslationTickProgressFn,
  type TranslationTickProgressOptions,
} from '@i18nprune/core';
import { hideCursor, showCursor } from '@/shared/terminal/cursor.js';
import type { TranslationProgress } from '@/types/core/progress/index.js';
import { canPrintProgress } from '@/utils/logger/policy.js';
import { rewindStderrForRedraw } from '@/shared/cursor/index.js';
import { style } from '@/utils/style/index.js';
import { truncateToDisplayWidth } from '@/utils/width/index.js';
import { formatDurationMs, toUnicodeSuperscriptInt, truncateMiddle } from './format.js';

const BAR_WIDTH = 28;
const KEY_MAX = 54;
const MAX_KEY_ROWS = 5;

/**
 * Multi-line **stderr** progress: bar + key path(s) + wall / avg / ETA (cursor-up redraw on TTY).
 * Falls back to a single `\r` line when stderr is not a TTY.
 */
export function createRichTranslationProgress(): TranslationProgress {
  if (!process.stderr.isTTY) {
    return createMinimalTranslationProgress();
  }

  let hidden = false;
  let lineCount = 0;
  const started = Date.now();
  let pausedAccum = 0;
  let pauseAnchor: number | null = null;
  let elapsedAtPauseAnchor = 0;
  let heartbeat: NodeJS.Timeout | null = null;
  let lastCurrent = 0;
  let lastTotal = 0;
  let lastLabel = '(root)';
  let lastOptions: TranslationTickProgressOptions | undefined;
  let hasSnapshot = false;
  /** While an interactive prompt owns stderr above us, skip redraw. */
  let promptOpen = false;

  const reclaimBlock = (): void => {
    if (lineCount === 0) return;
    rewindStderrForRedraw(lineCount);
    lineCount = 0;
  };

  const rewindAndClearBlock = (): void => {
    if (lineCount === 0) return;
    rewindStderrForRedraw(lineCount);
  };

  const fitLineToTerminal = (line: string): string => {
    const cols = process.stderr.columns;
    if (!Number.isFinite(cols) || !cols || cols <= 2) return line;
    // Reserve one column so styled lines never wrap and leave stale fragments behind.
    return truncateToDisplayWidth(line, cols - 1);
  };

  const elapsedMs = (now: number): number => {
    if (pauseAnchor !== null) return elapsedAtPauseAnchor;
    return now - started - pausedAccum;
  };

  const hideMisleadingThroughput = (options?: TranslationTickProgressOptions): boolean =>
    isTranslationProgressParallelPoolPhase(options) && options?.pool === undefined;

  const render = (current: number, total: number, label: string, options?: TranslationTickProgressOptions): void => {
    lastOptions = options;
    const now = Date.now();
    const elapsed = elapsedMs(now);
    const pct = total === 0 ? 100 : Math.round((current / total) * 100);
    const filled = Math.round((pct / 100) * BAR_WIDTH);
    const bar =
      style.accent('█'.repeat(filled)) + style.dim('░'.repeat(BAR_WIDTH - filled));

    const hideThroughput = hideMisleadingThroughput(options);
    const avgMs = !hideThroughput && current > 0 ? elapsed / current : 0;
    const etaMs =
      !hideThroughput && current < total && current > 0 && avgMs > 0
        ? (total - current) * avgMs
        : 0;
    const etaStr = hideThroughput
      ? '—'
      : current >= total
        ? formatDurationMs(0)
        : etaMs > 0
          ? formatDurationMs(etaMs)
          : '—';
    const avgStr = hideThroughput ? '—' : current > 0 ? formatDurationMs(avgMs) : '—';

    const pool = options?.pool;
    const poolKeys =
      isTranslationProgressParallelPoolPhase(options) &&
      pool &&
      pool.activeBySlot.length > 0;

    let poolHint = '';
    if (isTranslationProgressParallelPoolPhase(options)) {
      if (pool) {
        const inflight = pool.activeBySlot.length;
        poolHint = ` ${style.dim(`(parallel · ${String(inflight)} in flight · jobs ${String(current)}/${String(total)})`)}`;
      } else {
        poolHint = ` ${style.dim('(parallel translate)')}`;
      }
    }

    // Clear the previous frame first so shrinking key rows cannot leave stale lines behind.
    rewindAndClearBlock();

    const keyLines: string[] = [];
    if (poolKeys && pool) {
      const sorted = [...pool.activeBySlot].sort((a, b) => a.slot - b.slot);
      const head = sorted.slice(0, MAX_KEY_ROWS);
      const rest = sorted.length - head.length;
      for (const row of head) {
        const sup = toUnicodeSuperscriptInt(row.slot + 1);
        const pathLine = truncateMiddle(row.path, KEY_MAX - 4);
        keyLines.push(`  ${style.dim('key')}${sup} ${pathLine}`);
      }
      if (rest > 0) {
        keyLines.push(`  ${style.dim(`… +${String(rest)} more`)}`);
      }
    } else {
      keyLines.push(`  ${style.dim('key')}  ${truncateMiddle(label || '(root)', KEY_MAX)}`);
    }

    const lines = [
      `  ${bar} ${style.dim(`${String(current)}/${String(total)}`)} ${style.bold(String(pct))}${style.dim('%')}`,
      ...keyLines,
      `  ${style.dim('time')} ${style.dim('wall')} ${formatDurationMs(elapsed)}  ${style.dim('avg')} ${avgStr}  ${style.dim('ETA')} ${etaStr}${poolHint}`,
    ];

    for (const ln of lines) {
      process.stderr.write('\x1b[K' + fitLineToTerminal(ln) + '\n');
    }
    lineCount = lines.length;
  };

  const stopHeartbeat = (): void => {
    if (!heartbeat) return;
    clearInterval(heartbeat);
    heartbeat = null;
  };

  const startHeartbeat = (): void => {
    if (heartbeat) return;
    heartbeat = setInterval(() => {
      if (!hidden || !hasSnapshot || pauseAnchor !== null || promptOpen) return;
      render(lastCurrent, lastTotal, lastLabel, lastOptions);
    }, 1000);
    heartbeat.unref?.();
  };

  return {
    quiet: false,
    tick(current, total, label, options?: TranslationTickProgressOptions) {
      if (promptOpen) return;
      if (!hidden) {
        process.stderr.write(hideCursor());
        hidden = true;
      }
      lastCurrent = current;
      lastTotal = total;
      lastLabel = label || '(root)';
      hasSnapshot = true;
      render(lastCurrent, lastTotal, lastLabel, options);
      startHeartbeat();
    },
    pauseClock(opts?: { clearBar?: boolean }) {
      if (pauseAnchor !== null) return;
      promptOpen = true;
      stopHeartbeat();
      const clearBar = opts?.clearBar !== false;
      if (clearBar) {
        reclaimBlock();
        process.stderr.write(showCursor());
        hidden = false;
      } else if (hidden) {
        process.stderr.write(showCursor());
      }
      // Do not clear hasSnapshot when clearing the bar — resume redraws last tick snapshot.
      pauseAnchor = Date.now();
      elapsedAtPauseAnchor = pauseAnchor - started - pausedAccum;
    },
    resumeClock() {
      if (pauseAnchor === null) return;
      pausedAccum += Date.now() - pauseAnchor;
      pauseAnchor = null;
      promptOpen = false;
      if (lastTotal > 0 && process.stderr.isTTY) {
        if (!hidden) {
          process.stderr.write(hideCursor());
          hidden = true;
        }
        render(lastCurrent, lastTotal, lastLabel, lastOptions);
      }
      startHeartbeat();
    },
    done() {
      stopHeartbeat();
      reclaimBlock();
      if (hidden) {
        process.stderr.write(showCursor());
        hidden = false;
      }
    },
    fail() {
      stopHeartbeat();
      reclaimBlock();
      if (hidden) {
        process.stderr.write(showCursor());
        hidden = false;
      }
    },
  };
}

/** Single-line fallback for non-TTY stderr (e.g. piped logs). */
function createMinimalTranslationProgress(): TranslationProgress {
  let hidden = false;
  return {
    quiet: false,
    tick(current, total, label, options?: TranslationTickProgressOptions) {
      if (!hidden && process.stderr.isTTY) {
        process.stderr.write(hideCursor());
        hidden = true;
      }
      const pool = options?.pool;
      const extra =
        pool && pool.activeBySlot.length > 0
          ? ` [${pool.activeBySlot.length} inflight]`
          : '';
      const line = `  [${String(current)}/${String(total)}] ${label}${extra}`;
      process.stderr.write(`\r\x1b[2K${line}`);
    },
    pauseClock(_opts?: { clearBar?: boolean }) {},
    resumeClock() {},
    done() {
      if (hidden) {
        process.stderr.write('\r\x1b[2K');
        process.stderr.write(showCursor());
        hidden = false;
      }
    },
    fail() {
      if (hidden) {
        process.stderr.write('\r\x1b[2K');
        process.stderr.write(showCursor());
        hidden = false;
      }
    },
  };
}

/** Pass-through from core **`tickProgress`** to a session renderer (generate wiring). */
export function bindTranslationProgressTick(progress: TranslationProgress): TranslationTickProgressFn {
  return (i, total, path, opts) => progress.tick(i, total, path, opts);
}

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
      tick() {
        /* no-op */
      },
      pauseClock(_opts?: { clearBar?: boolean }) {},
      resumeClock() {},
      done() {},
      fail() {},
    };
  }
  return createRichTranslationProgress();
}
