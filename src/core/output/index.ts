import { getRunOptions } from '@/core/runtime/options.js';
import type { Context } from '@/types/core/context/index.js';
import type { CommandSummary } from '@/types/core/output/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';

export type { CommandSummary };

/** Print a command summary (respects `Context.run` / global `--json`, `--quiet`, `--silent`). */
export function printCommandSummary(summary: CommandSummary, ctx?: Pick<Context, 'run'>): void {
  const run = ctx?.run ?? getRunOptions();
  if (run.json) {
    console.log(JSON.stringify({ kind: 'summary', ...summary }));
    return;
  }
  if (!canPrintInfo(run)) return;
  const parts = [summary.command];
  if (summary.ok !== undefined) parts.push(summary.ok ? 'ok' : 'failed');
  if (summary.durationMs !== undefined) parts.push(`${String(summary.durationMs)}ms`);
  logger.info(parts.join(' · '), run);
  if (summary.counts && Object.keys(summary.counts).length > 0) {
    for (const [k, v] of Object.entries(summary.counts)) {
      logger.detail(`  ${k}: ${String(v)}`, run);
    }
  }
  if (summary.notes) {
    for (const n of summary.notes) logger.detail(n, run);
  }
}

/**
 * Reserved for future `--report-file` / CI artifacts.
 */
export function writeOutputFile(_path: string, _data: string): void {}
