import type { ProjectStoredMetadata } from '../../types/project/metadata.js';
import type { StoredReportMetadata } from '../../types/project/report/index.js';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Narrow worker `GET /v1/projects/:id` `data` to stored metadata when shape matches. */
export function parseWorkerProjectStoredMetadata(data: unknown): ProjectStoredMetadata | undefined {
  if (!isRecord(data)) return undefined;
  if (!isRecord(data.artifact) || typeof data.artifact.id !== 'string' || typeof data.artifact.contentHash !== 'string') {
    return undefined;
  }
  if (!isRecord(data.timing) || !isRecord(data.processor)) return undefined;
  return data as ProjectStoredMetadata;
}

/** Narrow worker `GET /v1/reports/:id` `data` to stored metadata when shape matches. */
export function parseWorkerReportStoredMetadata(data: unknown): StoredReportMetadata | undefined {
  if (!isRecord(data)) return undefined;
  if (!isRecord(data.artifact) || typeof data.artifact.id !== 'string') return undefined;
  if (!isRecord(data.timing) || !isRecord(data.processor)) return undefined;
  return data as StoredReportMetadata;
}
