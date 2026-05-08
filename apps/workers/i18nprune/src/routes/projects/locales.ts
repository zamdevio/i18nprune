import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import { getProjectById, projectStore } from '../shared/store';
import type { WorkerEnv } from '../types';

export function localesRoute(app: Hono<WorkerEnv>): void {
  app.get('/v1/projects/:id/locales', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    const localeJsonByTag = project.snapshot.localeJsonByTag ?? {};
    const tags = Object.keys(localeJsonByTag).sort((a, b) => a.localeCompare(b));
    return ApiResponse.success(c, {
      projectId: project.projectId,
      sourceLocalePath: project.snapshot.extraction?.sourceLocalePath ?? null,
      localesDir: project.snapshot.extraction?.localesDir ?? null,
      locales: tags.map((tag) => ({
        tag,
        isSource:
          (project.snapshot.extraction?.sourceLocalePath ?? '').replace(/^.*\//, '').replace(/\.json$/, '') === tag,
      })),
    });
  });

  app.get('/v1/projects/:id/locales/:tag', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    const tag = c.req.param('tag');
    const localeJson = (project.snapshot.localeJsonByTag ?? {})[tag];
    if (!localeJson) {
      return ApiResponse.notFound(c, 'LOCALE_NOT_FOUND', `Locale not found for tag: ${tag}`);
    }
    return ApiResponse.success(c, {
      projectId: project.projectId,
      tag,
      localeJson,
    });
  });
}
