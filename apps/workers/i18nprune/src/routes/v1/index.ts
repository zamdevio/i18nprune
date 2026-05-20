import { Hono } from 'hono';
import { registerCapabilitiesRoutes } from './capabilities';
import { registerProjectRoutes } from './projects';
import { registerStoredReportRoutes } from './reports';
import type { WorkerEnv } from '../types';

export function registerV1Routes(app: Hono<WorkerEnv>): void {
  const v1 = new Hono<WorkerEnv>();
  registerCapabilitiesRoutes(v1);
  registerProjectRoutes(v1);
  registerStoredReportRoutes(v1);
  app.route('/v1', v1);
}
