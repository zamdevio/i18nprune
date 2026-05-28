import type { ProjectUploadSnapshotMeta } from '../types/project/workerApi.js';
import type { ProjectStoreRow } from '../types/project/store.js';
import { buildProjectStoredMetadata } from './storedMetadata.js';

/** Builds upload response metadata from a persisted project row. */
export function buildProjectUploadSnapshotMeta(row: ProjectStoreRow): ProjectUploadSnapshotMeta {
  const meta = buildProjectStoredMetadata(row);
  return {
    fileCount: meta.artifact.fileCount,
    textFileCount: meta.artifact.textFileCount,
    detectedConfigPath: meta.artifact.detectedConfigPath,
    extractionReady: meta.analysis !== null,
    expiresAt: meta.retention.expiresAt,
    timing: meta.timing,
    processor: meta.processor,
    extraction:
      meta.analysis === null
        ? null
        : {
            configHash: meta.analysis.configHash,
            sourceLocalePath: meta.analysis.sourceLocalePath,
            srcRoot: meta.analysis.srcRoot,
            localesDir: meta.analysis.localesDir,
            keyObservationsCount: meta.analysis.keyObservationsCount,
            dynamicSitesCount: meta.analysis.dynamicSitesCount,
            cache: meta.cache,
          },
  };
}
