import { hideCursor, showCursor } from '@/core/terminal/cursor.js';
import type { TranslationProgress } from '@/types/core/progress/index.js';
import { style } from '@/utils/style/index.js';
import { formatDurationMs, truncateMiddle } from '@/core/progress/format.js';

const BAR_WIDTH = 28;
const KEY_MAX = 56;

/**
 * Multi-line **stderr** progress: bar + key path + wall / avg / ETA (cursor-up redraw on TTY).
 * Falls back to a single `\r` line when stderr is not a TTY.
 */
export function createRichTranslationProgress(): TranslationProgress {
  if (!process.stderr.isTTY) {
    return createMinimalTranslationProgress();
  }

  let hidden = false;
  let lineCount = 0;
  const started = Date.now();

  const clearBlock = (): void => {
    if (lineCount === 0) return;
    process.stderr.write(`\x1b[${String(lineCount)}A`);
    for (let i = 0; i < lineCount; i += 1) {
      process.stderr.write('\x1b[K\n');
    }
    lineCount = 0;
  };

  return {
    quiet: false,
    tick(current, total, label) {
      if (!hidden) {
        process.stderr.write(hideCursor());
        hidden = true;
      }
      const now = Date.now();
      const elapsed = now - started;
      const pct = total === 0 ? 100 : Math.round((current / total) * 100);
      const filled = Math.round((pct / 100) * BAR_WIDTH);
      const bar =
        style.accent('█'.repeat(filled)) + style.dim('░'.repeat(BAR_WIDTH - filled));
      const avgMs = current > 0 ? elapsed / current : 0;
      const etaMs =
        current < total && current > 0 && avgMs > 0 ? (total - current) * avgMs : 0;
      const etaStr =
        current >= total ? formatDurationMs(0) : etaMs > 0 ? formatDurationMs(etaMs) : '—';
      const avgStr = current > 0 ? formatDurationMs(avgMs) : '—';

      if (lineCount > 0) {
        process.stderr.write(`\x1b[${String(lineCount)}A`);
      }

      const keyLine = truncateMiddle(label || '(root)', KEY_MAX);
      const lines = [
        `  ${bar} ${style.dim(`${String(current)}/${String(total)}`)} ${style.bold(String(pct))}${style.dim('%')}`,
        `  ${style.dim('key')}  ${keyLine}`,
        `  ${style.dim('time')} ${style.dim('wall')} ${formatDurationMs(elapsed)}  ${style.dim('avg')} ${avgStr}  ${style.dim('ETA')} ${etaStr}`,
      ];

      for (const ln of lines) {
        process.stderr.write('\x1b[K' + ln + '\n');
      }
      lineCount = lines.length;
    },
    done() {
      if (hidden) {
        clearBlock();
        process.stderr.write(showCursor());
        hidden = false;
      }
    },
    fail() {
      if (hidden) {
        clearBlock();
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
    tick(current, total, label) {
      if (!hidden && process.stderr.isTTY) {
        process.stderr.write(hideCursor());
        hidden = true;
      }
      const line = `  [${String(current)}/${String(total)}] ${label}`;
      process.stderr.write(`\r\x1b[2K${line}`);
    },
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
