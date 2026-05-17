import { getRunOptions } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import { joinMetaSubtitle } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDetail, canPrintInfo } from '@/utils/logger/policy.js';

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
    leafCount: number;
    dryRun?: boolean;
  },
  run?: RunOptions,
): void {
  const r = run ?? getRunOptions();
  const sub = joinMetaSubtitle(opts.target, opts.englishName, opts.nativeName, opts.direction);
  if (!canPrintInfo(r)) return;
  if (opts.dryRun) {
    logger.info(
      `dry-run: no locale files written — would write ${opts.targetPath} (${String(opts.leafCount)} leaves).`,
      r,
    );
    logger.info(sub, r);
    return;
  }
  logger.info(sub, r);
  logger.info(`Wrote ${opts.targetPath} (${String(opts.leafCount)} leaves).`, r);
}
