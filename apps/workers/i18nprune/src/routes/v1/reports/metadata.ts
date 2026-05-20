import { buildStoredReportMetadata } from '@i18nprune/core';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { projectStore } from '../../shared/store';
import { getReportById } from '../../shared/reportStore';
import type { WorkerEnv } from '../../types';

export function metadataReportRoute(app: Hono<WorkerEnv>): void {
  app.get('/reports/:id', async (c) => {
    const stub = projectStore(c.env);
    const row = await getReportById(stub, c.req.param('id'));
    if (!row) return ApiResponse.notFound(c, 'REPORT_NOT_FOUND', 'Report not found');
    return ApiResponse.success(c, buildStoredReportMetadata(row));
  });
}
