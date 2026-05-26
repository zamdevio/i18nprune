import {
  parseWorkerShareEnvelope,
  resolveShareRemoteDeleteOutcome,
  resolveShareWorkerBaseUrl,
} from '@i18nprune/core';
import type { WorkerReportDeleteResult } from '../types/worker/index.js';
import { workerFetchJson } from './workerHttp.js';

function normalizeBaseUrl(url: string): string {
  return resolveShareWorkerBaseUrl(url);
}

export async function deleteWorkerReport(
  workerBaseUrl: string,
  reportId: string,
): Promise<WorkerReportDeleteResult> {
  const { httpStatus, body } = await workerFetchJson(
    `${normalizeBaseUrl(workerBaseUrl)}/v1/reports/${encodeURIComponent(reportId)}`,
    { method: 'DELETE' },
  );
  const envelope = parseWorkerShareEnvelope(body);
  const outcome = resolveShareRemoteDeleteOutcome({ httpStatus, envelope, kind: 'report' });
  if (outcome.deletedRemote) {
    return { ok: true, alreadyAbsent: outcome.alreadyAbsent, issue: outcome.issue };
  }
  return {
    ok: false,
    issue: outcome.issue ?? {
      severity: 'error',
      code: 'i18nprune.share.remote_error',
      message: 'Could not delete report on the worker.',
    },
  };
}
