import type { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { openApiDocument } from '../../openapi';
import type { WorkerEnv } from '../types';

export function registerDocsRoutes(app: Hono<WorkerEnv>): void {
  app.get('/openapi.json', (c) => c.json(openApiDocument));
  app.get('/docs', swaggerUI({ url: '/openapi.json' }));
}
