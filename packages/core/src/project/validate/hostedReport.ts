import { ISSUE_REPORT_HOSTED_REPORT_INVALID } from '../../shared/constants/issueCodes.js';
import { parseWorkerIngestForceField } from '../../shared/workerApi/ingestForce.js';
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
  if (raw.force !== undefined && raw.force !== false && raw.force !== true) {
    return { ok: false, issues: [err('force must be a boolean when provided')] };
  }
  const validated = await validateReportIngest({ reportDocument: document });
  if (!validated.ok) return validated;
  const force = parseWorkerIngestForceField(raw.force);
  return force ? { ...validated, force: true } : validated;
}
