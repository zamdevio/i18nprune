import { coalesceWorkerIngestForce } from '@i18nprune/core';
import type { Context } from 'hono';
import type { WorkerEnv } from '../types';

/** Resolves `?force=true` and optional JSON `force` on ingest POST handlers. */
export function workerIngestForceFromRequest(c: Context<WorkerEnv>, bodyForce?: unknown): boolean {
  return coalesceWorkerIngestForce({ query: c.req.query('force'), bodyFlag: bodyForce });
}
