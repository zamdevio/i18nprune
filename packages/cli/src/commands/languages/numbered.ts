import { style } from '@/utils/ansi/index.js';
import { getRunOptions } from '@/core/runtime/options.js';
import type { TranslateTargetLanguage } from '@/core/languages/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintPrimary } from '@/utils/logger/policy.js';

/** Default output: one row per language, no column grid (robust for all scripts). */
export function printLanguagesNumberedList(rows: readonly TranslateTargetLanguage[]): void {
  const run = getRunOptions();
  if (!canPrintPrimary(run)) return;

  if (rows.length === 0) {
    logger.primary(style.dim('  (no rows)'), run);
    return;
  }

  const idxW = String(rows.length).length;
  rows.forEach((r, i) => {
    const n = String(i + 1).padStart(idxW, ' ');
    logger.primary(
      `  ${style.dim(n + '.')}  ${style.accent(r.code)}  ${style.dim('·')}  ${style.dim(r.english)}  ${style.dim('·')}  ${style.ok(r.native)}`,
      run,
    );
  });
}
