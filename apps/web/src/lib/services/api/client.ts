import type { ProjectUploadResponse, WorkerApiEnvelope } from '@i18nprune/core';
import { ensureWorkerReachable } from './remoteGate';

export function okEnvelope<T>(data: T): WorkerApiEnvelope<T> {
  return {
    code: 'OK',
    success: true,
    data,
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString(),
  };
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

async function parseEnvelope<T>(resp: Response): Promise<WorkerApiEnvelope<T>> {
  const body = (await resp.json()) as WorkerApiEnvelope<T>;
  if (!resp.ok || !body.success) {
    const err = body.errors[0];
    throw new Error(err ? `${err.code}: ${err.message}` : `Request failed (${resp.status})`);
  }
  return body;
}

/** True when {@link parseEnvelope} rejected the response with `PROJECT_NOT_FOUND` (worker cache miss / eviction). */
export function isWorkerProjectNotFoundError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('PROJECT_NOT_FOUND:');
}

export async function uploadProject(
  workerBaseUrl: string,
  archive: File,
  configJson?: string,
): Promise<WorkerApiEnvelope<ProjectUploadResponse>> {
  await ensureWorkerReachable(workerBaseUrl);
  const form = new FormData();
  form.set('archive', archive);
  if (configJson && configJson.trim().length > 0) {
    form.set('configJson', configJson);
  }
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects`, {
    method: 'POST',
    body: form,
  });
  return parseEnvelope<ProjectUploadResponse>(resp);
}

export async function getProjectMetadata(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}`);
  return parseEnvelope<unknown>(resp);
}

export async function getProjectTree(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/tree`);
  return parseEnvelope<unknown>(resp);
}

export async function getProjectSnapshot(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/snapshot`);
  return parseEnvelope<unknown>(resp);
}

export async function runWorkerValidate(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  return parseEnvelope<unknown>(resp);
}

export async function runWorkerReview(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/review`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  return parseEnvelope<unknown>(resp);
}

export async function runWorkerMissing(
  workerBaseUrl: string,
  projectId: string,
  targetTag?: string,
): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const payload = targetTag && targetTag.trim().length > 0 ? { targetTag } : {};
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/missing`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseEnvelope<unknown>(resp);
}

export async function runWorkerReport(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/report`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  return parseEnvelope<unknown>(resp);
}

export async function getWorkerLocales(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/locales`);
  return parseEnvelope<unknown>(resp);
}

export async function getWorkerLocaleByTag(
  workerBaseUrl: string,
  projectId: string,
  tag: string,
): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(
    `${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/locales/${encodeURIComponent(tag)}`,
  );
  return parseEnvelope<unknown>(resp);
}

export async function getWorkerDoctor(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}/doctor`);
  return parseEnvelope<unknown>(resp);
}

export async function deleteProject(workerBaseUrl: string, projectId: string): Promise<WorkerApiEnvelope<unknown>> {
  await ensureWorkerReachable(workerBaseUrl);
  const resp = await fetch(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
  return parseEnvelope<unknown>(resp);
}
