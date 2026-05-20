import { describe, expect, it } from 'vitest';
import { ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE, ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND } from '../../shared/constants/issueCodes.js';
import { parseWorkerShareEnvelope, shareRemoteIssueFromWorker } from '../remote.js';

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

  it('maps payload too large 400', () => {
    const issue = shareRemoteIssueFromWorker({
      httpStatus: 400,
      envelope: parseWorkerShareEnvelope({
        success: false,
        data: null,
        errors: [{ code: 'UPLOAD_ZIP_TOO_LARGE', message: 'too big' }],
      }),
    });
    expect(issue?.code).toBe(ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE);
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
