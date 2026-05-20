import type { ShareCacheEntry } from '../../types/share/entry.js';

/**
 * One canonical worker id per row: `workerProjectId` for projects, `workerReportId` for reports.
 * Drops the legacy/wrong field so round-trips do not re-trigger repair.
 */
export function normalizeShareCacheEntry(entry: ShareCacheEntry): ShareCacheEntry {
  const base = {
    kind: entry.kind,
    workerBaseUrl: entry.workerBaseUrl,
    payloadContentHash: entry.payloadContentHash,
    byteSize: entry.byteSize,
    uploadedAt: entry.uploadedAt,
    lastUsedAt: entry.lastUsedAt,
    links: entry.links,
  };
  if (entry.kind === 'project') {
    const workerProjectId = entry.workerProjectId ?? entry.workerReportId;
    return {
      ...base,
      kind: 'project',
      workerProjectId: workerProjectId ?? '',
      ...(entry.configHash !== undefined ? { configHash: entry.configHash } : {}),
      ...(entry.inputFilesEpoch !== undefined ? { inputFilesEpoch: entry.inputFilesEpoch } : {}),
    };
  }
  const workerReportId = entry.workerReportId ?? entry.workerProjectId;
  return {
    ...base,
    kind: 'report',
    workerReportId: workerReportId ?? '',
  };
}

/** True when a parsed JSON row still uses the wrong worker id field name for its kind. */
export function shareEntryRawNeedsIdRepair(row: Record<string, unknown>): boolean {
  if (row.kind === 'project') {
    return typeof row.workerReportId === 'string' && row.workerReportId.length > 0;
  }
  if (row.kind === 'report') {
    return typeof row.workerProjectId === 'string' && row.workerProjectId.length > 0;
  }
  return false;
}
