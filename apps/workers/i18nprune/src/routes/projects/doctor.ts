import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import { getProjectById, projectStore } from '../shared/store';
import type { WorkerEnv } from '../types';

export function doctorRoute(app: Hono<WorkerEnv>): void {
  app.get('/v1/projects/:id/doctor', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    const extraction = project.snapshot.extraction;
    const checks = [
      { id: 'snapshot_present', ok: true, message: 'Project snapshot exists in Durable Object storage.' },
      { id: 'resolved_config_present', ok: Boolean(project.snapshot.resolvedConfig), message: 'Resolved config is available.' },
      { id: 'source_locale_present', ok: Boolean(project.snapshot.sourceLocaleJson), message: 'Source locale JSON is cached.' },
      { id: 'extraction_present', ok: Boolean(extraction), message: 'Extraction cache is available.' },
      { id: 'locales_cached', ok: Object.keys(project.snapshot.localeJsonByTag ?? {}).length > 0, message: 'Locale JSON map is cached.' },
    ];
    return ApiResponse.success(c, {
      projectId: project.projectId,
      ok: checks.every((x) => x.ok),
      checks,
      stats: {
        fileCount: project.snapshot.fileCount,
        textFileCount: project.snapshot.textFileCount,
        localeCount: Object.keys(project.snapshot.localeJsonByTag ?? {}).length,
      },
    });
  });
}
