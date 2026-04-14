import type { ProjectReportDocument } from '@/types/command/report/index.js';
import type { ReportCommandFormat } from '@/types/command/report/index.js';

/** Payload inside `CliJsonEnvelope<'report', …>` (`document` matches `report --format json` file shape). */
export type ReportCliJsonPayload = {
  kind: 'report';
  format: ReportCommandFormat;
  /** Resolved path written, or `null` if the write was skipped (same as human “Skipped report write”). */
  outputPath: string | null;
  document: ProjectReportDocument;
};
