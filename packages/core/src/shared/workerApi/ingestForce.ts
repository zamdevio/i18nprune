import { stableStringify } from '../../share/util/stableJson.js';
import { WORKER_INGEST_FORCE_QUERY } from '../constants/worker.js';
import type { HostedProjectIngestEnvelope } from '../../types/project/prepare/index.js';

/**
 * Force ingest does **not** change the content hash — `projectHash` / `payloadContentHash` stay the
 * SHA256 of the zip or report bytes. Force only skips `HASH_ALREADY_EXISTS` dedup and replaces the
 * single cached row for that hash (new `projectId` / `reportId`, same hash index → one DO row per hash).
 */

/** Resolves share/worker upload force (CLI `--force` → `ShareRunInput.force`). Default false. */
export function resolveShareUploadForce(force?: boolean): boolean {
  return force === true;
}

/** Query `?force=true` on POST ingest/archive routes. */
export function parseWorkerIngestForceQuery(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value === '') return false;
  const v = value.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/** JSON body `force: true` on prepared/report ingest. */
export function parseWorkerIngestForceField(raw: unknown): boolean {
  return raw === true;
}

export function coalesceWorkerIngestForce(input: {
  query?: string | null;
  bodyFlag?: unknown;
}): boolean {
  return parseWorkerIngestForceQuery(input.query) || parseWorkerIngestForceField(input.bodyFlag);
}

export function appendWorkerIngestForceQuery(url: string, force: boolean): string {
  if (!force) return url;
  const parsed = new URL(url);
  parsed.searchParams.set(WORKER_INGEST_FORCE_QUERY, 'true');
  return parsed.toString();
}

export function withHostedProjectIngestForce(
  envelope: HostedProjectIngestEnvelope,
  force: boolean,
): HostedProjectIngestEnvelope {
  if (!force) return envelope;
  return { ...envelope, force: true };
}

export function serializeHostedProjectIngestBody(
  envelope: HostedProjectIngestEnvelope,
  force?: boolean,
): string {
  const payload = resolveShareUploadForce(force) ? withHostedProjectIngestForce(envelope, true) : envelope;
  return stableStringify(payload);
}

export function serializeHostedReportIngestBody(document: unknown, force?: boolean): string {
  const payload: { document: unknown; force?: boolean } = { document };
  if (resolveShareUploadForce(force)) payload.force = true;
  return stableStringify(payload);
}

export function workerProjectIngestUrl(workerBaseUrl: string, force?: boolean): string {
  return appendWorkerIngestForceQuery(`${workerBaseUrl.replace(/\/$/, '')}/v1/projects`, resolveShareUploadForce(force));
}

export function workerReportIngestUrl(workerBaseUrl: string, force?: boolean): string {
  return appendWorkerIngestForceQuery(`${workerBaseUrl.replace(/\/$/, '')}/v1/reports`, resolveShareUploadForce(force));
}

export function workerProjectArchiveIngestUrl(workerBaseUrl: string, force?: boolean): string {
  return appendWorkerIngestForceQuery(
    `${workerBaseUrl.replace(/\/$/, '')}/v1/projects/archive`,
    resolveShareUploadForce(force),
  );
}

export function workerReportArchiveIngestUrl(workerBaseUrl: string, force?: boolean): string {
  return appendWorkerIngestForceQuery(
    `${workerBaseUrl.replace(/\/$/, '')}/v1/reports/archive`,
    resolveShareUploadForce(force),
  );
}
