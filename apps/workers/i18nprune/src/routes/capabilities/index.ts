import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import type { WorkerEnv } from '../types';

export function registerCapabilitiesRoutes(app: Hono<WorkerEnv>): void {
  const payload = {
    mode: 'read-only',
    readOnly: true,
    supportedOperations: ['validate', 'review', 'missing', 'locales', 'doctor', 'report'],
    writeOperations: ['sync', 'fill', 'generate', 'cleanup', 'missing-apply'],
    guidance:
      'Use CLI/IDE extension for write-heavy operations. This worker is intentionally read-focused by default.',
  } as const;

  app.get('/v1/capabilities', (c) =>
    ApiResponse.success(c, {
      ...payload,
    }),
  );
}
