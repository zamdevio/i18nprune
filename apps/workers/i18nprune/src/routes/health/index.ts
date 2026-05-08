import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import type { WorkerEnv } from '../types';

export function registerHealthRoutes(app: Hono<WorkerEnv>): void {
  app.get('/health', (c) => ApiResponse.success(c, { service: 'i18nprune-worker' }));
}
