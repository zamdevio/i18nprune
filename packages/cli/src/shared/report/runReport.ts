import { runReportOperation } from '@/commands/report/buildEnvelope.js';
import type { ReportCliRunOptions } from '@/types/command/report/index.js';
import type { ReportCliJsonPayload } from '@/types/command/report/json.js';
import type { CliJsonEnvelope } from '@i18nprune/core';

/** Same file write + envelope as `report` with global `--json` (stdout envelope; disk output per `--format` / `--out`). */
export async function runReport(
  opts: ReportCliRunOptions,
): Promise<CliJsonEnvelope<'report', ReportCliJsonPayload>> {
  const { envelope } = await runReportOperation(opts);
  return envelope;
}
