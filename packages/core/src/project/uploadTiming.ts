import type { ProjectSnapshot } from '../types/project/upload.js';
import type { ProjectUploadSnapshotMeta } from '../types/project/workerApi.js';

function isoMsDelta(startIso: string, endIso: string): number | undefined {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return undefined;
  return Math.max(0, end - start);
}

/** Builds upload response metadata + timing deltas from a stored project snapshot. */
export function buildProjectUploadSnapshotMeta(snapshot: ProjectSnapshot): ProjectUploadSnapshotMeta {
  const extraction = snapshot.extraction;
  const extractionComputedAt = extraction?.computedAt ?? snapshot.uploadedAt;
  const extractionStartedAt = extraction?.extractionStartedAt ?? snapshot.uploadedAt;
  const requestReceivedAt = snapshot.requestReceivedAt ?? snapshot.uploadedAt;
  const storedAt = snapshot.storedAt ?? extractionComputedAt;

  const extractionMs = isoMsDelta(extractionStartedAt, extractionComputedAt);
  const persistMs = isoMsDelta(extractionComputedAt, storedAt);
  const totalMs = isoMsDelta(requestReceivedAt, storedAt);

  return {
    requestReceivedAt,
    uploadedAt: snapshot.uploadedAt,
    extractionStartedAt,
    extractionComputedAt,
    storedAt,
    fileCount: snapshot.fileCount,
    textFileCount: snapshot.textFileCount,
    detectedConfigPath: snapshot.detectedConfigPath,
    extractionReady: Boolean(extraction),
    ...(extractionMs !== undefined ? { extractionMs } : {}),
    ...(persistMs !== undefined ? { persistMs } : {}),
    ...(totalMs !== undefined ? { totalMs } : {}),
  };
}
