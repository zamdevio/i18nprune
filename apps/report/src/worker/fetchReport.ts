import {
  ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  parseWorkerShareEnvelope,
  resolveShareWorkerBaseUrl,
  shareRemoteIssueFromWorker,
} from '@i18nprune/core';
import { validatePayloadValue, type PayloadLoadResult } from '../data/loader/validate.js';
import type { WorkerReportDocumentResult, WorkerReportMetadataResult } from '../types/worker/index.js';
import { workerFetchJson } from './workerHttp.js';

function normalizeBaseUrl(url: string): string {
  return resolveShareWorkerBaseUrl(url);
}

export async function fetchWorkerReportMetadata(
  workerBaseUrl: string,
  reportId: string,
): Promise<WorkerReportMetadataResult> {
  const { httpStatus, body } = await workerFetchJson(
    `${normalizeBaseUrl(workerBaseUrl)}/v1/reports/${encodeURIComponent(reportId)}`,
  );
  const envelope = parseWorkerShareEnvelope(body);
  if (httpStatus >= 200 && httpStatus < 300 && envelope.success) {
    return { ok: true, data: envelope.data };
  }
  const issue =
    shareRemoteIssueFromWorker({ httpStatus, envelope }) ?? {
      severity: 'error' as const,
      code: ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
      message: 'Report not found on the worker.',
    };
  return { ok: false, issue };
}

export async function fetchWorkerReportDocument(
  workerBaseUrl: string,
  reportId: string,
): Promise<WorkerReportDocumentResult> {
  const { httpStatus, body } = await workerFetchJson(
    `${normalizeBaseUrl(workerBaseUrl)}/v1/reports/${encodeURIComponent(reportId)}/document`,
  );
  const envelope = parseWorkerShareEnvelope(body);
  if (httpStatus >= 200 && httpStatus < 300 && envelope.success) {
    const data = envelope.data;
    const document =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>).document
        : undefined;
    if (document !== undefined) {
      return validatePayloadValue(document);
    }
    return {
      ok: false,
      kind: 'schema',
      message: 'Worker response did not include a report document.',
      detail: 'GET /v1/reports/:id/document returned success without a `document` field.',
    };
  }
  const issue = shareRemoteIssueFromWorker({ httpStatus, envelope });
  if (issue) {
    return {
      ok: false,
      kind: 'schema',
      message: issue.message,
      detail: issue.code,
    };
  }
  return {
    ok: false,
    kind: 'schema',
    message: 'Could not load report from the worker.',
    detail: `HTTP ${String(httpStatus)}`,
  };
}
