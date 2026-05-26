import { describe, expect, it } from 'vitest';
import { PROJECT_SHARE_PREPARED_MAX_BYTES } from '../../constants/share.js';
import {
  workerErrorFromIssue,
  workerErrorFromCode,
  workerErrorHttpStatus,
  workerPayloadTooLargeError,
  workerHashAlreadyExistsWarning,
  workerProjectNotFoundError,
  workerStorageLimitError,
} from '../errors.js';
import {
  ISSUE_PROJECT_HOSTED_SNAPSHOT_INVALID,
  ISSUE_PROJECT_HOSTED_SNAPSHOT_SCHEMA_VERSION,
} from '../../constants/issueCodes.js';

describe('workerApi errors', () => {
  it('maps upload size codes to PAYLOAD_TOO_LARGE with 413', () => {
    const err = workerErrorFromCode('PAYLOAD_TOO_LARGE', 'Zip exceeds max size');
    expect(err.code).toBe('PAYLOAD_TOO_LARGE');
    expect(err.action).toBe('reduce_payload');
    expect(err.recoverable).toBe(true);
    expect(workerErrorHttpStatus(err.code)).toBe(413);
  });

  it('maps hosted snapshot issues to PAYLOAD_REJECTED / INVALID_SCHEMA', () => {
    const rejected = workerErrorFromIssue({
      severity: 'error',
      code: ISSUE_PROJECT_HOSTED_SNAPSHOT_INVALID,
      message: 'bad snapshot',
    });
    expect(rejected.code).toBe('PAYLOAD_REJECTED');
    expect(rejected.action).toBe('fix_payload');

    const schema = workerErrorFromIssue({
      severity: 'error',
      code: ISSUE_PROJECT_HOSTED_SNAPSHOT_SCHEMA_VERSION,
      message: 'wrong version',
    });
    expect(schema.code).toBe('INVALID_SCHEMA');
  });

  it('builds prepared project payload too large details', () => {
    const err = workerPayloadTooLargeError({
      kind: 'project_prepared',
      receivedBytes: PROJECT_SHARE_PREPARED_MAX_BYTES + 1,
      maxBytes: PROJECT_SHARE_PREPARED_MAX_BYTES,
    });
    expect(err.details?.maxBytes).toBe(PROJECT_SHARE_PREPARED_MAX_BYTES);
    expect(err.details?.receivedBytes).toBe(PROJECT_SHARE_PREPARED_MAX_BYTES + 1);
  });

  it('maps not-found codes to 404 without PAYLOAD_EXPIRED', () => {
    expect(workerErrorHttpStatus('PROJECT_NOT_FOUND')).toBe(404);
    expect(workerErrorHttpStatus('PAYLOAD_EXPIRED' as string)).toBe(400);
    const err = workerProjectNotFoundError();
    expect(err.action).toBe('reupload');
    expect(err.recoverable).toBe(true);
  });

  it('builds HASH_ALREADY_EXISTS warning for dedup UX', () => {
    const w = workerHashAlreadyExistsWarning('project', 'abc123');
    expect(w.code).toBe('HASH_ALREADY_EXISTS');
    expect(w.message).toContain('abc123');
  });

  it('builds self-host storage limit guidance', () => {
    const err = workerStorageLimitError();
    expect(err.code).toBe('STORAGE_QUOTA_EXCEEDED');
    expect(err.action).toBe('self_host');
    expect(err.suggestions?.some((s) => s.includes('apps/workers'))).toBe(true);
  });
});
