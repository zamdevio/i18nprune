import type { Hono } from 'hono';
import { deleteReportRoute } from './delete';
import { documentReportRoute } from './document';
import { metadataReportRoute } from './metadata';
import { uploadReportRoute } from './upload';
import { uploadReportArchiveRoute } from './uploadArchive';
import type { WorkerEnv } from '../../types';

export function registerStoredReportRoutes(app: Hono<WorkerEnv>): void {
  uploadReportRoute(app);
  uploadReportArchiveRoute(app);
  documentReportRoute(app);
  metadataReportRoute(app);
  deleteReportRoute(app);
}
