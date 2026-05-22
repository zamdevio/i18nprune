import { runReport } from '../../report/run.js';
import { buildReportDocumentFromAnalysis } from './fromAnalysis.js';
import { validateReportIngest } from './reportIngest.js';
import type { PrepareReportForShareInput } from '../../types/report/prepareShare.js';
import type { ValidateReportIngestResult } from '../../types/report/ingest.js';

export { validateReportIngest, validateReportIngest as prepareReportPayload } from './reportIngest.js';
export { reportDocumentForShareContentHash } from './reportSemantic.js';

/**
 * Host-side report prepare: live scan via {@link runReport}, or validate-only when `analysis` is precomputed.
 */
export async function prepareReportForShare(input: PrepareReportForShareInput): Promise<ValidateReportIngestResult> {
  if (input.analysis !== undefined) {
    const built = buildReportDocumentFromAnalysis({
      ctx: input.ctx,
      analysis: input.analysis,
      environment: input.host.environment,
      cwd: input.host.cwd,
      toolVersion: input.host.toolVersion,
    });
    return validateReportIngest({ reportDocument: built.document });
  }

  const run = runReport(input.ctx, { source: 'project' }, input.host);
  if (run.issues.some((i) => i.severity === 'error')) {
    return { ok: false, issues: run.issues.filter((i) => i.severity === 'error') };
  }
  return validateReportIngest({ reportDocument: run.payload.document });
}
