import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { getProjectById, projectStore } from '../../shared/store';
import type { WorkerEnv } from '../../types';

export function snapshotRoute(app: Hono<WorkerEnv>): void {
  app.get('/projects/:id/snapshot', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    return ApiResponse.success(c, {
      projectId: project.projectId,
      snapshot: project.snapshot,
    });
  });
}
