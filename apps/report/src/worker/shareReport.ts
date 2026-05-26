import {
  buildHostedReportUploadRequest,
  buildReportShareLinks,
  ISSUE_SHARE_REMOTE_ERROR,
  parseWorkerShareEnvelope,
  resolveShareWorkerBaseUrl,
  shareRemoteIssueFromWorker,
  workerDataReportId,
  workerUploadWasDeduped,
  type Issue,
} from '@i18nprune/core';
import type { ProjectReportDocument } from '../types/index.js';
import { buildHostedReportShareUrl } from '../lib/share/reportShareUrl.js';
import type { ReportShareLinkOnlyOutcome, ReportShareUploadOutcome } from '../types/worker.js';
import { workerFetchJson } from './workerHttp.js';

function normalizeBaseUrl(url: string): string {
  return resolveShareWorkerBaseUrl(url);
}

/** Hosted report already on the worker — copy link only (no re-upload). */
export function shareRemoteReportLinkOnly(input: {
  workerBaseUrl: string;
  reportId: string;
}): ReportShareLinkOnlyOutcome {
  const workerBaseUrl = normalizeBaseUrl(input.workerBaseUrl);
  const links = buildReportShareLinks({ workerBaseUrl, reportId: input.reportId });
  const link = links.report ?? buildHostedReportShareUrl(input.reportId);
  const humanLines = [
    'Link-only share: this report is already hosted on the worker.',
    `Report: ${link}`,
    `Worker metadata: ${links.worker}`,
    'Hosted reports expire after ~7 days without reads on the worker.',
  ];
  return { ok: true, link, humanLines };
}

/** Upload report JSON from paste/file import (`POST /v1/reports`). */
export async function shareReportUpload(input: {
  workerBaseUrl: string;
  document: ProjectReportDocument;
  force?: boolean;
}): Promise<ReportShareUploadOutcome> {
  const workerBaseUrl = normalizeBaseUrl(input.workerBaseUrl);
  const humanLines: string[] = [
    `Prepared report: ${JSON.stringify(input.document).length} bytes (browser upload).`,
  ];
  if (input.force) {
    humanLines.push('Force ingest: worker replaces any prior row for this payload hash.');
  }

  const req = buildHostedReportUploadRequest({
    workerBaseUrl,
    document: input.document,
    force: input.force,
  });

  const { httpStatus, body } = await workerFetchJson(req.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: req.body,
  });
  const envelope = parseWorkerShareEnvelope(body);
  const issue = shareRemoteIssueFromWorker({ httpStatus, envelope });
  if (issue) {
    return { ok: false, issue, humanLines };
  }

  const reportId = workerDataReportId(envelope.data);
  if (!reportId) {
    const missing: Issue = {
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_ERROR,
      message: 'Upload succeeded but reportId was missing from the worker response.',
    };
    return { ok: false, issue: missing, humanLines };
  }

  const links = buildReportShareLinks({ workerBaseUrl, reportId });
  const link = links.report ?? buildHostedReportShareUrl(reportId);
  const deduped = workerUploadWasDeduped(envelope);
  if (deduped) {
    humanLines.push('Worker reused existing report (HASH_ALREADY_EXISTS — same payload hash).');
  } else {
    humanLines.push('Uploaded to worker.');
  }
  humanLines.push(`Report: ${link}`);
  humanLines.push(`Worker metadata: ${links.worker}`);
  humanLines.push('Hosted reports expire after ~7 days without reads on the worker.');

  return { ok: true, reportId, link, deduped, humanLines };
}
