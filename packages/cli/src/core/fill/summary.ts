import { getRunOptions } from '@/core/runtime/options.js';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { joinMetaSubtitle } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { getLanguageByCode } from '@/core/languages/index.js';

export function printFillDryRunSummary(
  opts: {
    target: string;
    targetPath: string;
    metaPath: string | null;
    showMeta: boolean;
    leafTotal: number;
    direction: 'ltr' | 'rtl';
  },
  run?: RunOptions,
): void {
  const r = run ?? getRunOptions();
  if (!canPrintInfo(r)) return;
  logger.info(
    `dry-run: no locale files written — would write ${opts.targetPath} (${String(opts.leafTotal)} leaves).`,
    r,
  );
  if (opts.showMeta && opts.metaPath) {
    logger.info(`dry-run: would write ${opts.metaPath}`, r);
  }
  const cat = getLanguageByCode(opts.target);
  const sub = joinMetaSubtitle(
    opts.target,
    cat?.english ?? opts.target,
    cat?.native ?? opts.target,
    opts.direction,
  );
  logger.info(`  ${sub}`, r);
}

export function printFillTargetFinalizeSummary(
  opts: {
    target: string;
    updated: number;
    targetPath: string;
    metaPath: string | null;
    dryRun: boolean;
    showMeta: boolean;
  },
  run?: RunOptions,
): void {
  const r = run ?? getRunOptions();
  if (!canPrintInfo(r)) return;
  const prefix = opts.dryRun ? 'dry-run' : 'fill';
  logger.info(
    `${prefix}: ${opts.target} · updated ${String(opts.updated)} leaf value(s) · ${opts.targetPath}`,
    r,
  );
  if (opts.showMeta && opts.metaPath) {
    logger.info(`${prefix}: meta ${opts.metaPath}`, r);
  }
}
