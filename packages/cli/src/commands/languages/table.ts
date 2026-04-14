import { style } from '@/utils/ansi/index.js';
import { getRunOptions } from '@/core/runtime/options.js';
import { displayWidth, padToDisplayWidth } from '@/utils/width/index.js';
import type { TranslateTargetLanguage } from '@/core/languages/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintPrimary } from '@/utils/logger/policy.js';

function rowDisplayWidth(wNo: number, wCode: number, wEn: number, wNat: number): number {
  const s = `│ ${padToDisplayWidth('0', wNo)} │ ${padToDisplayWidth('0', wCode)} │ ${padToDisplayWidth('0', wEn)} │ ${padToDisplayWidth('0', wNat)} │`;
  return displayWidth(s);
}

/** Bordered table: No. + Code + English + Native; widths from display width; shrink if > terminal. */
export function printTranslateLanguageTable(rows: readonly TranslateTargetLanguage[]): void {
  const run = getRunOptions();
  if (!canPrintPrimary(run)) return;

  if (rows.length === 0) {
    logger.primary(style.dim('  (no rows)'), run);
    return;
  }

  const termCols =
    typeof process.stdout?.columns === 'number' && process.stdout.columns > 40
      ? process.stdout.columns
      : 120;

  const hNo = 'No.';
  const hCode = 'Code';
  const hEn = 'English';
  const hNat = 'Native';

  let wNo = Math.max(displayWidth(hNo), ...rows.map((_, i) => displayWidth(String(i + 1))));
  let wCode = Math.max(displayWidth(hCode), ...rows.map((r) => displayWidth(r.code)));
  let wEn = Math.max(displayWidth(hEn), ...rows.map((r) => displayWidth(r.english)));
  let wNat = Math.max(displayWidth(hNat), ...rows.map((r) => displayWidth(r.native)));

  while (
    rowDisplayWidth(wNo, wCode, wEn, wNat) > termCols &&
    (wEn > displayWidth(hEn) || wNat > displayWidth(hNat))
  ) {
    if (wEn >= wNat && wEn > displayWidth(hEn)) {
      wEn -= 1;
    } else if (wNat > displayWidth(hNat)) {
      wNat -= 1;
    } else {
      break;
    }
  }

  const sep = style.dim('│');
  const cell = (w: number) => style.dim('─'.repeat(w + 2));

  const topBar =
    style.dim('╭') +
    cell(wNo) +
    style.dim('┬') +
    cell(wCode) +
    style.dim('┬') +
    cell(wEn) +
    style.dim('┬') +
    cell(wNat) +
    style.dim('╮');
  const midBar =
    style.dim('├') +
    cell(wNo) +
    style.dim('┼') +
    cell(wCode) +
    style.dim('┼') +
    cell(wEn) +
    style.dim('┼') +
    cell(wNat) +
    style.dim('┤');
  const botBar =
    style.dim('╰') +
    cell(wNo) +
    style.dim('┴') +
    cell(wCode) +
    style.dim('┴') +
    cell(wEn) +
    style.dim('┴') +
    cell(wNat) +
    style.dim('╯');

  logger.primary(topBar, run);
  logger.primary(
    `${sep} ${style.bold(padToDisplayWidth(hNo, wNo))} ${sep} ${style.bold(padToDisplayWidth(hCode, wCode))} ${sep} ${style.bold(padToDisplayWidth(hEn, wEn))} ${sep} ${style.bold(padToDisplayWidth(hNat, wNat))} ${sep}`,
    run,
  );
  logger.primary(midBar, run);

  rows.forEach((r, i) => {
    const n = padToDisplayWidth(String(i + 1), wNo);
    const c0 = padToDisplayWidth(r.code, wCode);
    const c1 = padToDisplayWidth(r.english, wEn);
    const c2 = padToDisplayWidth(r.native, wNat);
    logger.primary(
      `${sep} ${style.dim(n)} ${sep} ${style.accent(c0)} ${sep} ${style.dim(c1)} ${sep} ${style.ok(c2)} ${sep}`,
      run,
    );
  });

  logger.primary(botBar, run);
}
