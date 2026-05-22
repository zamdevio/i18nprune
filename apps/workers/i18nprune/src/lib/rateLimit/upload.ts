import { workerRateLimitedError } from '@i18nprune/core';
import type { Context } from 'hono';
import { ApiResponse } from '../../response';
import { projectStore } from '../../routes/shared/store.js';
import type { WorkerEnv } from '../../routes/types.js';

function clientIp(c: Context<WorkerEnv>): string {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * Increments per-IP upload counters in the global project DO and returns 429 when over quota.
 * Returns null when the upload may proceed.
 */
export async function uploadRateLimitResponse(c: Context<WorkerEnv>): Promise<Response | null> {
  const stub = projectStore(c.env);
  const resp = await stub.fetch('https://do/ratelimit/upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ip: clientIp(c) }),
  });
  const body = (await resp.json()) as { allowed: boolean; retryAfterSeconds?: number };
  if (body.allowed) return null;
  const retryAfterSeconds = body.retryAfterSeconds ?? 3600;
  return ApiResponse.structuredError(c, workerRateLimitedError(retryAfterSeconds), 429);
}
