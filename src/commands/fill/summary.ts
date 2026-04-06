import { getRunOptions } from '@/core/runtime/options.js';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { joinMetaSubtitle } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { getLanguageByCode } from '@/core/languages/index.js';

export function printFillDryRunSummary(
  opts: {
    lang: string;
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
  const cat = getLanguageByCode(opts.lang);
  const sub = joinMetaSubtitle(
    opts.lang,
    cat?.english ?? opts.lang,
    cat?.native ?? opts.lang,
    opts.direction,
  );
  logger.info(`  ${sub}`, r);
}
