import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import { projectStore } from '../shared/store';
import type { WorkerEnv } from '../types';

export function deleteRoute(app: Hono<WorkerEnv>): void {
  app.delete('/v1/projects/:id', async (c) => {
    const stub = projectStore(c.env);
    const resp = await stub.fetch(`https://do/project/${encodeURIComponent(c.req.param('id'))}`, { method: 'DELETE' });
    const body = (await resp.json()) as { ok: boolean; existed: boolean };
    return ApiResponse.success(c, { deleted: body.existed });
  });
}
