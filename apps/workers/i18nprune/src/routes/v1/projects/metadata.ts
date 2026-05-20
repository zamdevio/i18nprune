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
    return ApiResponse.success(c, {
      projectId: project.projectId,
      projectHash: project.projectHash,
      uploadedAt: project.snapshot.uploadedAt,
      zipBytes: project.snapshot.zipBytes,
      fileCount: project.snapshot.fileCount,
      textFileCount: project.snapshot.textFileCount,
      detectedConfigPath: project.snapshot.detectedConfigPath,
      localeTags: Object.keys(localeJsonByTag).sort((a, b) => a.localeCompare(b)),
      extraction: project.snapshot.extraction
        ? {
            configHash: project.snapshot.extraction.configHash,
            sourceLocalePath: project.snapshot.extraction.sourceLocalePath,
            srcRoot: project.snapshot.extraction.srcRoot,
            localesDir: project.snapshot.extraction.localesDir,
            keyObservationsCount: project.snapshot.extraction.keyObservationsCount,
            dynamicSitesCount: project.snapshot.extraction.dynamicSitesCount,
            computedAt: project.snapshot.extraction.computedAt,
          }
        : null,
    });
  });
}
