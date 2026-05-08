import { getRunOptions } from '@i18nprune/core';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { style } from '@/utils/style/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDetail, canPrintInfo } from '@/utils/logger/policy.js';
import type { SyncFileLine } from '@/types/command/sync/summary.js';

/**
 * Human-oriented sync stats (info + dim detail). Skipped in **`-s` / `--json`**; uses **`info`** / **`detail`** gates
 * (suppressed under **`--quiet`** like other info lines).
 */
export function printSyncHumanSummary(
  opts: {
    files: SyncFileLine[];
    dynamicSiteCount: number;
    dryRun: boolean;
    listLimit: number;
  },
  run?: RunOptions,
): void {
  const r = run ?? getRunOptions();
  if (!canPrintInfo(r)) return;

  logger.info(
    `${String(opts.files.length)} target file(s) · ${String(opts.dynamicSiteCount)} dynamic key site(s)`,
    r,
  );

  const changed = opts.files.filter((f) => f.changed).length;
  const verb = opts.dryRun ? 'Would change' : 'Updated';
  logger.info(`${verb}: ${String(changed)} · Unchanged: ${String(opts.files.length - changed)}`, r);

  if (!canPrintDetail(r)) return;

  const show = opts.files.slice(0, opts.listLimit);
  for (const f of show) {
    const mark = f.changed ? style.ok('✓') : style.dim('·');
    const tail = f.changed
      ? opts.dryRun
        ? style.dim(' (would write)')
        : style.dim(' (written)')
      : style.dim(' (unchanged)');
    logger.detail(`  ${mark} ${f.path}${tail}`, r);
  }
  if (opts.files.length > opts.listLimit) {
    logger.detail(
      style.dim(`  … ${String(opts.files.length - opts.listLimit)} more file(s) not listed`),
      r,
    );
  }
}
