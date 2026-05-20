import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import { projectStore } from '../shared/store';
import { deleteReport } from '../shared/reportStore';
import type { WorkerEnv } from '../types';

export function deleteReportRoute(app: Hono<WorkerEnv>): void {
  app.delete('/v1/reports/:id', async (c) => {
    const stub = projectStore(c.env);
    const existed = await deleteReport(stub, c.req.param('id'));
    return ApiResponse.success(c, { deleted: existed });
  });
}
