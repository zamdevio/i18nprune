import type { ShareHostHooks } from '@i18nprune/core';
import { normalizeWorkerBaseUrl } from '@i18nprune/core';

function workerNetworkErrorBody(err: unknown): { success: false; errors: Array<{ code: string; message: string }> } {
  const message = err instanceof Error ? err.message : String(err);
  return { success: false, errors: [{ code: 'NETWORK_ERROR', message }] };
}

function parseWorkerResponseBody(text: string): unknown {
  if (text.length === 0) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      success: false,
      errors: [{ code: 'WORKER_BODY_INVALID', message: 'Worker response was not valid JSON.' }],
    };
  }
}

async function workerFetchJson(url: string, init?: RequestInit): Promise<{ httpStatus: number; body: unknown }> {
  try {
    const resp = await fetch(url, init);
    const text = await resp.text();
    return { httpStatus: resp.status, body: parseWorkerResponseBody(text) };
  } catch (err) {
    return { httpStatus: 0, body: workerNetworkErrorBody(err) };
  }
}

/** CLI host hooks: raw HTTP to the worker API (envelope parsing stays in core `share/remote`). */
export function createShareWorkerHooks(_workerBaseUrl: string): Pick<
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
      workerFetchJson(`${base(w)}/v1/projects/${encodeURIComponent(projectId)}`),
    fetchRemoteReportRow: async ({ workerBaseUrl: w, reportId }) =>
      workerFetchJson(`${base(w)}/v1/reports/${encodeURIComponent(reportId)}`),
    uploadProject: async ({ workerBaseUrl: w, zipBytes }) => {
      const form = new FormData();
      form.set('archive', new Blob([zipBytes], { type: 'application/zip' }), 'project.zip');
      return workerFetchJson(`${base(w)}/v1/projects`, { method: 'POST', body: form });
    },
    uploadReport: async ({ workerBaseUrl: w, document }) =>
      workerFetchJson(`${base(w)}/v1/reports`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document }),
      }),
    deleteRemoteProject: async ({ workerBaseUrl: w, projectId }) =>
      workerFetchJson(`${base(w)}/v1/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' }),
    deleteRemoteReport: async ({ workerBaseUrl: w, reportId }) =>
      workerFetchJson(`${base(w)}/v1/reports/${encodeURIComponent(reportId)}`, { method: 'DELETE' }),
  };
}
