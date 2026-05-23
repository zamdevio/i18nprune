import {
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  parseWorkerShareEnvelope,
  shareRemoteIssueFromWorker,
  type Issue,
} from '@i18nprune/core';
import type { WorkerProjectMetadataResult } from '../../types/index.js';
import { workerFetchJson } from './workerHttp.js';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

/** Metadata GET for shared links and probes — maps worker errors via core share helpers. */
export async function fetchWorkerProjectMetadata(
  workerBaseUrl: string,
  projectId: string,
): Promise<WorkerProjectMetadataResult> {
  const { httpStatus, body } = await workerFetchJson(
    `${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}`,
  );
  const envelope = parseWorkerShareEnvelope(body);
  if (httpStatus >= 200 && httpStatus < 300 && envelope.success) {
    return { ok: true, data: envelope.data };
  }
  const issue =
    shareRemoteIssueFromWorker({ httpStatus, envelope }) ?? {
      severity: 'error' as const,
      code: ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
      message: 'Project not found on the worker.',
    };
  return { ok: false, issue };
}

/** Maps thrown API client errors (`CODE: message`) into stable share {@link Issue} codes. */
export function shareIssueFromThrownError(err: unknown): Issue | null {
  if (!(err instanceof Error)) return null;
  const idx = err.message.indexOf(':');
  if (idx <= 0) return null;
  const code = err.message.slice(0, idx).trim();
  const message = err.message.slice(idx + 1).trim();
  const httpStatus = code === 'PROJECT_NOT_FOUND' ? 404 : code.startsWith('UPLOAD_') ? 400 : 0;
  return shareRemoteIssueFromWorker({
    httpStatus,
    envelope: parseWorkerShareEnvelope({
      success: false,
      errors: [{ code, message }],
    }),
  });
}

export function isShareRemoteProjectNotFound(issue: Issue | null | undefined): boolean {
  return issue?.code === ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND;
}
