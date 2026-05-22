import { describe, expect, it } from 'vitest';
import {
  isShareWorkerFetchRetryable,
  SHARE_WORKER_FETCH_MAX_ATTEMPTS,
  SHARE_WORKER_FETCH_TIMEOUT_MS,
} from '../fetch.js';

describe('share workerFetch policy', () => {
  it('uses 30s timeout and four attempts by default (initial + three retries)', () => {
    expect(SHARE_WORKER_FETCH_TIMEOUT_MS).toBe(30_000);
    expect(SHARE_WORKER_FETCH_MAX_ATTEMPTS).toBe(4);
  });

  it('treats network and overload responses as retryable', () => {
    expect(isShareWorkerFetchRetryable(0, { success: false, errors: [{ code: 'NETWORK_ERROR', message: 'x' }] })).toBe(
      true,
    );
    expect(isShareWorkerFetchRetryable(503, { success: false, errors: [] })).toBe(true);
    expect(
      isShareWorkerFetchRetryable(0, { success: false, errors: [{ code: 'UPLOAD_TIMEOUT', message: 'timed out' }] }),
    ).toBe(true);
    expect(
      isShareWorkerFetchRetryable(429, { success: false, errors: [{ code: 'RATE_LIMITED', message: 'slow down' }] }),
    ).toBe(true);
  });

  it('does not retry validation or not-found responses', () => {
    expect(isShareWorkerFetchRetryable(400, { success: false, errors: [{ code: 'INGEST_INVALID', message: 'x' }] })).toBe(
      false,
    );
    expect(isShareWorkerFetchRetryable(404, { success: false, errors: [{ code: 'PROJECT_NOT_FOUND', message: 'x' }] })).toBe(
      false,
    );
    expect(isShareWorkerFetchRetryable(413, { success: false, errors: [{ code: 'PAYLOAD_TOO_LARGE', message: 'x' }] })).toBe(
      false,
    );
  });
});
