import { getRunOptions } from '@/core/runtime/options.js';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { style } from '@/utils/style/index.js';
import { formatSectionTitle } from '@/utils/style/section.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative } from '@/utils/logger/policy.js';

const MAX_FILES_LISTED = 14;

export type SyncFileLine = { path: string; changed: boolean };

/**
 * Human-readable footer after **`sync`** (skipped when **`-q` / `-s` / `--json`** via **`canPrintDecorative`**).
 */
export function printSyncHumanSummary(
  opts: {
    sourcePath: string;
    localesDir: string;
    files: SyncFileLine[];
    dynamicSiteCount: number;
    dryRun: boolean;
    durationMs: number;
  },
  run?: RunOptions,
): void {
  const r = run ?? getRunOptions();
  if (!canPrintDecorative(r)) return;

  logger.primary('', r);
  logger.primary(formatSectionTitle('Sync summary'), r);
  logger.primary(style.dim(`  Source: ${opts.sourcePath}`), r);
  logger.primary(style.dim(`  Locales dir: ${opts.localesDir}`), r);
  logger.primary(
    style.dim(
      `  Duration: ${String(opts.durationMs)}ms · ${opts.files.length} target file(s) · ${String(opts.dynamicSiteCount)} dynamic key site(s)`,
    ),
    r,
  );

  const changed = opts.files.filter((f) => f.changed).length;
  const verb = opts.dryRun ? 'Would change' : 'Updated';
  logger.primary(`  ${verb}: ${String(changed)} · Unchanged: ${String(opts.files.length - changed)}`, r);

  const show = opts.files.slice(0, MAX_FILES_LISTED);
  for (const f of show) {
    const mark = f.changed ? style.ok('✓') : style.dim('·');
    const tail = f.changed
      ? opts.dryRun
        ? style.dim(' (would write)')
        : style.dim(' (written)')
      : style.dim(' (unchanged)');
    logger.primary(`  ${mark} ${f.path}${tail}`, r);
  }
  if (opts.files.length > MAX_FILES_LISTED) {
    logger.primary(
      style.dim(`  … ${String(opts.files.length - MAX_FILES_LISTED)} more file(s) not listed`),
      r,
  );
  }

  if (opts.dynamicSiteCount > 0) {
    logger.primary(
      style.dim(
        '  Dynamic keys are not merged by sync — use `i18nprune validate` (and future `locales dynamic`) for details.',
      ),
      r,
    );
  }
}
