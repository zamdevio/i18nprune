import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { getProjectById, projectStore } from '../../shared/store';
import type { WorkerEnv } from '../../types';

export function metadataRoute(app: Hono<WorkerEnv>): void {
  app.get('/projects/:id', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    const localeJsonByTag = project.snapshot.localeJsonByTag ?? {};
    const snap = project.snapshot;
    const timing = snap.extraction
      ? {
          requestReceivedAt: snap.requestReceivedAt ?? snap.uploadedAt,
          uploadedAt: snap.uploadedAt,
          extractionStartedAt: snap.extraction.extractionStartedAt ?? snap.uploadedAt,
          computedAt: snap.extraction.computedAt,
          storedAt: snap.storedAt ?? snap.extraction.computedAt,
        }
      : null;
    return ApiResponse.success(c, {
      projectId: project.projectId,
      projectHash: project.projectHash,
      uploadedAt: snap.uploadedAt,
      requestReceivedAt: snap.requestReceivedAt ?? null,
      storedAt: snap.storedAt ?? null,
      zipBytes: snap.zipBytes,
      fileCount: snap.fileCount,
      textFileCount: snap.textFileCount,
      detectedConfigPath: snap.detectedConfigPath,
      localeTags: Object.keys(localeJsonByTag).sort((a, b) => a.localeCompare(b)),
      timing,
      extraction: snap.extraction
        ? {
            configHash: snap.extraction.configHash,
            sourceLocalePath: snap.extraction.sourceLocalePath,
            srcRoot: snap.extraction.srcRoot,
            localesDir: snap.extraction.localesDir,
            keyObservationsCount: snap.extraction.keyObservationsCount,
            dynamicSitesCount: snap.extraction.dynamicSitesCount,
            extractionStartedAt: snap.extraction.extractionStartedAt ?? null,
            computedAt: snap.extraction.computedAt,
          }
        : null,
    });
  });
}
