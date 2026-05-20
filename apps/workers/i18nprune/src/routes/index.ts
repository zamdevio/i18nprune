import type { Hono } from 'hono';
import { ApiResponse } from '../response';
import { registerDocsRoutes } from './docs';
import { registerHealthRoutes } from './health';
import { registerV1Routes } from './v1';
import type { WorkerEnv } from './types';

export function registerRoutes(app: Hono<WorkerEnv>): void {
  app.get('/', (c) => {
    const base = new URL(c.req.url).origin;
    return ApiResponse.success(c, {
      service: 'i18nprune-worker',
      message: 'i18nprune Worker API is running. Use /docs for Swagger UI and /openapi.json for raw OpenAPI.',
      routes: {
        docs: `${base}/docs`,
        openapi: `${base}/openapi.json`,
        health: `${base}/health`,
        capabilities: `${base}/v1/capabilities`,
      },
    });
  });
  registerHealthRoutes(app);
  registerV1Routes(app);
  registerDocsRoutes(app);
}

export type { WorkerEnv } from './types';
