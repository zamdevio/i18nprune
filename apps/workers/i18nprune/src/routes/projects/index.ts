import type { Hono } from 'hono';
import { deleteRoute } from './delete';
import { doctorRoute } from './doctor';
import { localesRoute } from './locales';
import { metadataRoute } from './metadata';
import { missingRoute } from './missing';
import { reviewRoute } from './review';
import { snapshotRoute } from './snapshot';
import { treeRoute } from './tree';
import { uploadRoute } from './upload';
import { validateRoute } from './validate';
import type { WorkerEnv } from '../types';

export function registerProjectRoutes(app: Hono<WorkerEnv>): void {
  uploadRoute(app);
  metadataRoute(app);
  treeRoute(app);
  snapshotRoute(app);
  deleteRoute(app);
  validateRoute(app);
  reviewRoute(app);
  missingRoute(app);
  localesRoute(app);
  doctorRoute(app);
}
