import { stringifyCliCommandJson } from '@/core/result/cliJson.js';
import { issueCodeDocHref } from '@/core/result/issueDocLinks.js';
import { getRunOptions } from '@/core/runtime/options.js';
import type { Context } from '@/types/core/context/index.js';
import type { CommandSummary } from '@/types/core/output/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';

export type { CommandSummary };

/** Print a command summary (respects `Context.run` / global `--json`, `--quiet`, `--silent`). */
export function printCommandSummary(summary: CommandSummary, ctx?: Pick<Context, 'run'>): void {
  const run = ctx?.run ?? getRunOptions();
  const printIssueGuidance = () => {
    if (!summary.issues || summary.issues.length === 0) return;
    const seen = new Set<string>();
    for (const issue of summary.issues) {
      if (seen.has(issue.code)) continue;
      seen.add(issue.code);
      const href = issue.docHref ?? issueCodeDocHref(issue.code);
      // Show guidance even in -q; hide only in -s/--json.
      logger.warn(`issue: ${issue.code} · ${href}`, run);
    }
  };

  if (run.json) {
    const { issues: summaryIssues, ...summaryRest } = summary;
    const data = { kind: 'summary' as const, ...summaryRest };
    console.log(
      stringifyCliCommandJson({
        kind: 'summary',
        data,
        ok: summary.ok !== false,
        issues: summaryIssues,
        pretty: false,
      }),
    );
    return;
  }
  if (!canPrintInfo(run)) {
    if (!run.silent) printIssueGuidance();
    return;
  }
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
  printIssueGuidance();
}

/**
 * Reserved for future `--report-file` / CI artifacts.
 */
export function writeOutputFile(_path: string, _data: string): void {}
