import { stringifyCliCommandJson } from '@/shared/result/cliJson.js';
import { issueCodeDocHref } from '@i18nprune/core';
import { getRunOptions } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';
import type { CommandSummary } from '@/types/cli/output/index.js';
import type { CommandOutputHooks } from '@/types/cli/output/orchestration.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';

export type { CommandSummary };

/** Print a command summary (respects `Context.run` / global `--json`, `--quiet`, `--silent`). */
export function printCommandSummary(
  summary: CommandSummary,
  ctx?: Pick<Context, 'run'>,
  hooks?: CommandOutputHooks,
): void {
  const run = ctx?.run ?? getRunOptions();
  hooks?.beforeSummary?.({ run, summary });

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
    hooks?.afterSummary?.({ run, summary });
    return;
  }
  if (!canPrintInfo(run)) {
    if (!run.silent) printIssueGuidance();
    hooks?.afterSummary?.({ run, summary });
    return;
  }
  if (summary.counts && Object.keys(summary.counts).length > 0) {
    const countsLine = Object.entries(summary.counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(' · ');
    logger.info(`summary: ${countsLine}`, run);
  }
  if (summary.notes) {
    for (const n of summary.notes) logger.detail(n, run);
  }
  printIssueGuidance();
  const parts = [summary.command];
  if (summary.ok !== undefined) parts.push(summary.ok ? 'ok' : 'failed');
  if (summary.durationMs !== undefined) parts.push(`${String(summary.durationMs)}ms`);
  logger.info(parts.join(' · '), run);
  hooks?.afterSummary?.({ run, summary });
}
