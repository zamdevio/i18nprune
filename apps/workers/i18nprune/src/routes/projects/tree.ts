import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import { getProjectById, projectStore } from '../shared/store';
import type { WorkerEnv } from '../types';

export function treeRoute(app: Hono<WorkerEnv>): void {
  app.get('/v1/projects/:id/tree', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    return ApiResponse.success(c, {
      projectId: project.projectId,
      tree: project.snapshot.tree,
      stats: {
        fileCount: project.snapshot.fileCount,
        textFileCount: project.snapshot.textFileCount,
        zipBytes: project.snapshot.zipBytes,
      },
    });
  });
}
