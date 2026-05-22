import { workerStorageLimitError } from '@i18nprune/core';
import type { Context } from 'hono';
import { ApiResponse } from '../../response';
import type { WorkerEnv } from '../types';

type DoStorageFailureBody = {
  ok?: boolean;
  code?: string;
  message?: string;
  evictionAttempted?: boolean;
};

export function storageLimitResponseFromDo(c: Context<WorkerEnv>, body: DoStorageFailureBody): Response {
  const detail =
    body.evictionAttempted === true
      ? 'Storage is still full after evicting ~25% of idle cached projects and reports. Retry later or self-host.'
      : 'Worker storage is under pressure. Retries may succeed after automatic cleanup.';
  return ApiResponse.structuredError(
    c,
    workerStorageLimitError(
      typeof body.message === 'string' && body.message.length > 0
        ? `${body.message} ${detail}`
        : detail,
    ),
    507,
  );
}

export async function readDoStorageFailure(resp: Response): Promise<DoStorageFailureBody | null> {
  if (resp.ok) return null;
  try {
    const body = (await resp.json()) as DoStorageFailureBody;
    if (body.code === 'STORAGE_QUOTA_EXCEEDED') return body;
  } catch {
    return null;
  }
  return null;
}
