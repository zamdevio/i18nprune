import { ISSUE_REPORT_HOSTED_REPORT_INVALID } from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ValidateHostedReportIngestResult } from '../../types/report/ingest.js';
import { validateReportIngest } from '../prepare/reportIngest.js';

function err(message: string, code: string = ISSUE_REPORT_HOSTED_REPORT_INVALID): Issue {
  return { severity: 'error', code, message };
}

/** Validates primary `POST /v1/reports` JSON body (`{ document }`) before worker persist. */
export async function validateHostedReportIngestBody(body: unknown): Promise<ValidateHostedReportIngestResult> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, issues: [err('Expected JSON object ingest body')] };
  }
  const raw = body as Record<string, unknown>;
  const document = raw.document ?? raw.reportDocument;
  if (document === undefined) {
    return { ok: false, issues: [err('document is required')] };
  }
  return validateReportIngest({ reportDocument: document });
}
