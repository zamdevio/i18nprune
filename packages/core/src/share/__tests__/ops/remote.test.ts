import { describe, expect, it } from 'vitest';
import { ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE, ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND } from '../../../shared/constants/issueCodes.js';
import {
  parseWorkerShareEnvelope,
  resolveShareRemoteDeleteOutcome,
  shareRemoteIssueFromWorker,
  workerUploadExpiresAt,
  workerUploadWasDeduped,
} from '../../remote/remote.js';

describe('parseWorkerShareEnvelope', () => {
  it('parses success envelope', () => {
    const env = parseWorkerShareEnvelope({
      code: 'OK',
      success: true,
      data: { projectId: 'x' },
      errors: [],
    });
    expect(env.success).toBe(true);
    expect(env.data).toEqual({ projectId: 'x' });
  });

  it('handles invalid body', () => {
    const env = parseWorkerShareEnvelope(null);
    expect(env.success).toBe(false);
    expect(env.errors[0]?.code).toBe('WORKER_BODY_INVALID');
  });

  it('parses warnings and upload meta helpers', () => {
    const env = parseWorkerShareEnvelope({
      code: 'HASH_ALREADY_EXISTS',
      success: true,
      data: {
        projectId: 'p1',
        snapshotMeta: { expiresAt: '2026-05-29T00:00:00.000Z' },
      },
      errors: [],
      warnings: [{ code: 'HASH_ALREADY_EXISTS', message: 'reused' }],
    });
    expect(env.warnings?.[0]?.code).toBe('HASH_ALREADY_EXISTS');
    expect(workerUploadWasDeduped(env)).toBe(true);
    expect(workerUploadExpiresAt(env.data, 'project')).toBe('2026-05-29T00:00:00.000Z');
    expect(workerUploadExpiresAt({ expiresAt: '2026-05-29T12:00:00.000Z' }, 'report')).toBe(
      '2026-05-29T12:00:00.000Z',
    );
  });
});

describe('shareRemoteIssueFromWorker', () => {
  it('returns null on 200 success', () => {
    const issue = shareRemoteIssueFromWorker({
      httpStatus: 200,
      envelope: parseWorkerShareEnvelope({
        success: true,
        data: {},
        errors: [],
      }),
    });
    expect(issue).toBeNull();
  });

  it('maps PROJECT_NOT_FOUND 404', () => {
    const issue = shareRemoteIssueFromWorker({
      httpStatus: 404,
      envelope: parseWorkerShareEnvelope({
        success: false,
        data: null,
        errors: [{ code: 'PROJECT_NOT_FOUND', message: 'Project not found' }],
      }),
    });
    expect(issue?.code).toBe(ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND);
  });

  it('maps payload too large on 400', () => {
    const issue = shareRemoteIssueFromWorker({
      httpStatus: 400,
      envelope: parseWorkerShareEnvelope({
        success: false,
        data: null,
        errors: [{ code: 'PAYLOAD_TOO_LARGE', message: 'too big' }],
      }),
    });
    expect(issue?.code).toBe(ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE);
  });

  it('maps canonical PAYLOAD_TOO_LARGE on 413', () => {
    const issue = shareRemoteIssueFromWorker({
      httpStatus: 413,
      envelope: parseWorkerShareEnvelope({
        success: false,
        data: null,
        errors: [{ code: 'PAYLOAD_TOO_LARGE', message: 'too big' }],
      }),
    });
    expect(issue?.code).toBe(ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE);
  });

  it('maps RATE_LIMITED on 429 to unavailable', () => {
    const issue = shareRemoteIssueFromWorker({
      httpStatus: 429,
      envelope: parseWorkerShareEnvelope({
        success: false,
        data: null,
        errors: [{ code: 'RATE_LIMITED', message: 'slow down' }],
      }),
    });
    expect(issue?.message).toContain('RATE_LIMITED');
  });

  it('DELETE 200 with deleted:false is idempotent success with warning', () => {
    const out = resolveShareRemoteDeleteOutcome({
      httpStatus: 200,
      envelope: parseWorkerShareEnvelope({
        success: true,
        code: 'OK',
        data: { deleted: false },
        errors: [],
      }),
      kind: 'project',
    });
    expect(out.deletedRemote).toBe(true);
    expect(out.alreadyAbsent).toBe(true);
    expect(out.issue?.severity).toBe('warning');
  });

  it('DELETE 404 is idempotent success with warning', () => {
    const out = resolveShareRemoteDeleteOutcome({
      httpStatus: 404,
      envelope: parseWorkerShareEnvelope({
        success: false,
        errors: [{ code: 'REPORT_NOT_FOUND', message: 'Report not found' }],
      }),
      kind: 'report',
    });
    expect(out.deletedRemote).toBe(true);
    expect(out.alreadyAbsent).toBe(true);
    expect(out.issue?.severity).toBe('warning');
  });

  it('maps 413 without worker code', () => {
    const issue = shareRemoteIssueFromWorker({
      httpStatus: 413,
      envelope: parseWorkerShareEnvelope({
        success: false,
        data: null,
        errors: [{ code: 'PAYLOAD_TOO_LARGE', message: 'nope' }],
      }),
    });
    expect(issue?.code).toBe(ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE);
  });
});
