import type { RunOptions } from '@i18nprune/core';
import { logger } from '@/utils/logger/index.js';

/** Per-attempt ceiling for worker HTTP. */
export const SHARE_WORKER_FETCH_TIMEOUT_MS = 30_000;

/** Initial attempt plus three retries on retryable failures only. */
export const SHARE_WORKER_FETCH_MAX_ATTEMPTS = 4;

const RETRYABLE_HTTP_STATUSES = new Set([0, 408, 429, 502, 503, 504]);

/** Honored when the worker returns these codes in JSON `errors[]` (worker.md §B). */
const RETRYABLE_WORKER_CODES = new Set([
  'NETWORK_ERROR',
  'RATE_LIMITED',
  'WORKER_BUSY',
  'UPLOAD_TIMEOUT',
]);

export type WorkerFetchOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
};

function workerNetworkErrorBody(err: unknown): { success: false; errors: Array<{ code: string; message: string }> } {
  const message = err instanceof Error ? err.message : String(err);
  return { success: false, errors: [{ code: 'NETWORK_ERROR', message }] };
}

function workerTimeoutBody(timeoutMs: number): { success: false; errors: Array<{ code: string; message: string }> } {
  const sec = Math.max(1, Math.round(timeoutMs / 1000));
  return {
    success: false,
    errors: [{ code: 'UPLOAD_TIMEOUT', message: `Worker request timed out after ${String(sec)}s` }],
  };
}

export function parseWorkerResponseBody(text: string): unknown {
  if (text.length === 0) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      success: false,
      errors: [{ code: 'WORKER_BODY_INVALID', message: 'Worker response was not valid JSON.' }],
    };
  }
}

function firstWorkerErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  const errors = (body as Record<string, unknown>).errors;
  if (!Array.isArray(errors) || errors.length === 0) return undefined;
  const first = errors[0];
  if (!first || typeof first !== 'object' || Array.isArray(first)) return undefined;
  const code = (first as Record<string, unknown>).code;
  return typeof code === 'string' ? code : undefined;
}

/** True when another upload/view attempt may succeed (network blip, edge overload, timeout). */
export function isShareWorkerFetchRetryable(httpStatus: number, body: unknown): boolean {
  if (RETRYABLE_HTTP_STATUSES.has(httpStatus)) return true;
  if (httpStatus >= 500 && httpStatus < 600) return true;
  const workerCode = firstWorkerErrorCode(body);
  if (workerCode && RETRYABLE_WORKER_CODES.has(workerCode)) return true;
  return false;
}

function retryDelayMs(attempt: number): number {
  return 500 * attempt;
}

function logRetry(run: RunOptions | undefined, message: string): void {
  logger.warn(message, run);
}

async function workerFetchJsonOnce(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<{ httpStatus: number; body: unknown; timedOut: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    const text = await resp.text();
    return { httpStatus: resp.status, body: parseWorkerResponseBody(text), timedOut: false };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { httpStatus: 0, body: workerTimeoutBody(timeoutMs), timedOut: true };
    }
    return { httpStatus: 0, body: workerNetworkErrorBody(err), timedOut: false };
  } finally {
    clearTimeout(timer);
  }
}

export type WorkerFetchJsonResult = { httpStatus: number; body: unknown };

/**
 * Worker HTTP with per-attempt timeout and retries on retryable errors only.
 * Non-retryable responses (4xx schema/validation, 404, 413, etc.) return immediately.
 */
export async function workerFetchJson(
  url: string,
  init: RequestInit | undefined,
  run?: RunOptions,
  options?: WorkerFetchOptions,
): Promise<WorkerFetchJsonResult> {
  const timeoutMs = options?.timeoutMs ?? SHARE_WORKER_FETCH_TIMEOUT_MS;
  const maxAttempts = options?.maxAttempts ?? SHARE_WORKER_FETCH_MAX_ATTEMPTS;
  const timeoutSec = Math.max(1, Math.round(timeoutMs / 1000));
  let last: WorkerFetchJsonResult = { httpStatus: 0, body: workerNetworkErrorBody(new Error('no attempt')) };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await workerFetchJsonOnce(url, init, timeoutMs);
    last = { httpStatus: result.httpStatus, body: result.body };

    if (!isShareWorkerFetchRetryable(result.httpStatus, result.body)) {
      return last;
    }

    if (attempt >= maxAttempts) {
      return last;
    }

    const reason = result.timedOut
      ? `timed out after ${String(timeoutSec)}s`
      : `HTTP ${String(result.httpStatus)}`;
    logRetry(
      run,
      `Worker request ${reason} (attempt ${String(attempt)}/${String(maxAttempts)}); retrying…`,
    );
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt)));
  }

  return last;
}
