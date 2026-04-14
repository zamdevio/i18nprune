import { getRunOptions } from '@/core/runtime/options.js';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { style, joinMetaSubtitle } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDetail, canPrintInfo, canPrintPrimary } from '@/utils/logger/policy.js';

export function printPreserveParityReport(
  preserveCount: number,
  paritySkip: number,
  run?: RunOptions,
): void {
  const r = run ?? getRunOptions();
  if (!canPrintDetail(r)) return;
  if (preserveCount > 0) {
    logger.detail(`  Preserved (verbatim from source): ${String(preserveCount)}`, r);
  }
  if (paritySkip > 0) {
    logger.detail(`  Skipped (parity policy): ${String(paritySkip)}`, r);
  }
}

export function printGenerateFinalizeSummary(
  opts: {
    target: string;
    englishName: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
    targetPath: string;
    metaPath: string | null;
    leafCount: number;
    showMeta: boolean;
    dryRun?: boolean;
  },
  run?: RunOptions,
): void {
  const r = run ?? getRunOptions();
  const sub = joinMetaSubtitle(opts.target, opts.englishName, opts.nativeName, opts.direction);
  if (opts.dryRun) {
    if (!canPrintInfo(r)) return;
    logger.info(
      `dry-run: no locale files written — would write ${opts.targetPath} (${String(opts.leafCount)} leaves).`,
      r,
    );
    if (opts.showMeta && opts.metaPath) {
      logger.info(`dry-run: would write ${opts.metaPath}`, r);
    }
    logger.info(`  ${sub}`, r);
    return;
  }
  if (!canPrintPrimary(r)) return;
  logger.primary('', r);
  logger.primary(style.ok(`  Wrote ${opts.targetPath} (${String(opts.leafCount)} leaves).`), r);
  if (opts.showMeta && opts.metaPath) {
    logger.primary(style.dim(`  Meta: ${opts.metaPath}`), r);
  }
  logger.primary(style.dim(`  ${sub}`), r);
}
