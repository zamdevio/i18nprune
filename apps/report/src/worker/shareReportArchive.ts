import {
  ISSUE_SHARE_REMOTE_ERROR,
  parseWorkerShareEnvelope,
  shareRemoteIssueFromWorker,
  workerDataReportId,
  workerReportArchiveIngestUrl,
  workerUploadWasDeduped,
  type Issue,
} from '@i18nprune/core';
import { buildHostedReportShareUrl } from '../lib/share/reportShareUrl.js';
import type { ReportShareUploadOutcome } from '../types/worker/index.js';
import { workerFetchJson, zipBytesToArrayBuffer } from './workerHttp.js';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

/** Upload project zip to worker report archive route (`POST /v1/reports/archive`). */
export async function shareReportArchiveUpload(input: {
  workerBaseUrl: string;
  zipBytes: Uint8Array;
  zipFileName: string;
  configJson?: string;
  force?: boolean;
}): Promise<ReportShareUploadOutcome> {
  const workerBaseUrl = normalizeBaseUrl(input.workerBaseUrl);
  const humanLines: string[] = [`Archive zip: ${input.zipFileName} (${String(input.zipBytes.byteLength)} bytes).`];

  const form = new FormData();
  form.set(
    'archive',
    new Blob([zipBytesToArrayBuffer(input.zipBytes)], { type: 'application/zip' }),
    input.zipFileName,
  );
  const cfg = input.configJson?.trim();
  if (cfg && cfg.length > 0) form.set('configJson', cfg);

  const { httpStatus, body } = await workerFetchJson(workerReportArchiveIngestUrl(workerBaseUrl, input.force), {
    method: 'POST',
    body: form,
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

  const link = buildHostedReportShareUrl(reportId);
  const deduped = workerUploadWasDeduped(envelope);
  if (deduped) {
    humanLines.push('Worker reused existing report (HASH_ALREADY_EXISTS — same payload hash).');
  } else {
    humanLines.push('Uploaded archive to worker.');
  }
  humanLines.push(`Report: ${link}`);
  humanLines.push('Hosted reports expire after ~7 days without reads on the worker.');

  return { ok: true, reportId, link, deduped, humanLines };
}
