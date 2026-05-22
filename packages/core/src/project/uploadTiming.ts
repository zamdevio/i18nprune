import type { ProjectUploadSnapshotMeta } from '../types/project/workerApi.js';
import type { ProjectStoreRow } from '../types/project/store.js';
import { buildProjectStoredMetadata } from './storedMetadata.js';

/** Builds upload response metadata from a persisted project row. */
export function buildProjectUploadSnapshotMeta(row: ProjectStoreRow): ProjectUploadSnapshotMeta {
  const meta = buildProjectStoredMetadata(row);
  return {
    fileCount: meta.fileCount,
    textFileCount: meta.textFileCount,
    detectedConfigPath: meta.detectedConfigPath,
    extractionReady: meta.extraction !== null,
    expiresAt: meta.expiresAt,
    timing: meta.timing,
    processor: meta.processor,
    extraction: meta.extraction,
  };
}
