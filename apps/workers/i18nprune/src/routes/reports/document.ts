import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import { projectStore } from '../shared/store';
import { getReportById } from '../shared/reportStore';
import type { WorkerEnv } from '../types';

export function documentReportRoute(app: Hono<WorkerEnv>): void {
  app.get('/v1/reports/:id/document', async (c) => {
    const stub = projectStore(c.env);
    const row = await getReportById(stub, c.req.param('id'));
    if (!row) return ApiResponse.notFound(c, 'REPORT_NOT_FOUND', 'Report not found');
    return ApiResponse.success(c, { document: row.document });
  });
}
