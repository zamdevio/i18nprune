import type { ShareHostHooks } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import {
  buildHostedProjectUploadRequest,
  buildHostedReportUploadRequest,
  normalizeWorkerBaseUrl,
} from '@i18nprune/core';
import { SHARE_WORKER_FETCH_TIMEOUT_MS, workerFetchJson } from './fetch.js';

/** CLI host hooks: raw HTTP to the worker API (envelope parsing stays in core `share/remote`). */
export function createShareWorkerHooks(
  _workerBaseUrl: string,
  run?: RunOptions,
): Pick<
  ShareHostHooks,
  | 'fetchRemoteProjectRow'
  | 'fetchRemoteReportRow'
  | 'uploadProject'
  | 'uploadReport'
  | 'deleteRemoteProject'
  | 'deleteRemoteReport'
> {
  const base = (url: string) => normalizeWorkerBaseUrl(url);

  return {
    fetchRemoteProjectRow: async ({ workerBaseUrl: w, projectId }) =>
      workerFetchJson(
        `${base(w)}/v1/projects/${encodeURIComponent(projectId)}`,
        undefined,
        run,
        { maxAttempts: 1, timeoutMs: SHARE_WORKER_FETCH_TIMEOUT_MS },
      ),
    fetchRemoteReportRow: async ({ workerBaseUrl: w, reportId }) =>
      workerFetchJson(
        `${base(w)}/v1/reports/${encodeURIComponent(reportId)}`,
        undefined,
        run,
        { maxAttempts: 1, timeoutMs: SHARE_WORKER_FETCH_TIMEOUT_MS },
      ),
    uploadProject: async ({ workerBaseUrl: w, envelope, serialized, force }) => {
      const req = buildHostedProjectUploadRequest({
        workerBaseUrl: w,
        envelope,
        serialized,
        force,
      });
      return workerFetchJson(
        req.url,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: req.body,
        },
        run,
      );
    },
    uploadReport: async ({ workerBaseUrl: w, document, force }) => {
      const req = buildHostedReportUploadRequest({ workerBaseUrl: w, document, force });
      return workerFetchJson(
        req.url,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: req.body,
        },
        run,
      );
    },
    deleteRemoteProject: async ({ workerBaseUrl: w, projectId }) =>
      workerFetchJson(
        `${base(w)}/v1/projects/${encodeURIComponent(projectId)}`,
        { method: 'DELETE' },
        run,
      ),
    deleteRemoteReport: async ({ workerBaseUrl: w, reportId }) =>
      workerFetchJson(
        `${base(w)}/v1/reports/${encodeURIComponent(reportId)}`,
        { method: 'DELETE' },
        run,
      ),
  };
}
