import { describe, expect, it } from 'vitest';
import {
  ISSUE_SHARE_CACHE_ENTRY_NOT_FOUND,
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_UNAVAILABLE,
} from '../../../shared/constants/issueCodes.js';
import { runShareDelete } from '../../ops/delete.js';
import { parseWorkerShareEnvelope, resolveShareRemoteDeleteOutcome } from '../../remote/remote.js';
import type { CoreContext } from '../../../types/context/index.js';

function minimalCtx(): CoreContext {
  return { cache: undefined } as CoreContext;
}

describe('resolveShareRemoteDeleteOutcome', () => {
  it('treats 404 as idempotent success with warning', () => {
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

  it('maps network failure to error', () => {
    const out = resolveShareRemoteDeleteOutcome({
      httpStatus: 0,
      envelope: parseWorkerShareEnvelope({
        success: false,
        errors: [{ code: 'NETWORK_ERROR', message: 'fetch failed' }],
      }),
      kind: 'project',
    });
    expect(out.deletedRemote).toBe(false);
    expect(out.issue?.code).toBe(ISSUE_SHARE_REMOTE_UNAVAILABLE);
  });
});

describe('runShareDelete', () => {
  it('warns when share.json has no row but still deletes remote', async () => {
    const res = await runShareDelete({
      ctx: minimalCtx(),
      kind: 'report',
      workerBaseUrl: 'https://worker.test',
      workerId: 'missing-local',
      remote: true,
      hooks: {
        deleteRemoteReport: async () => ({
          httpStatus: 200,
          body: { success: true, code: 'OK', data: { deleted: true }, errors: [] },
        }),
      },
    });
    expect(res.deletedLocal).toBe(false);
    expect(res.deletedRemote).toBe(true);
    expect(res.issues.some((i) => i.code === ISSUE_SHARE_CACHE_ENTRY_NOT_FOUND)).toBe(true);
  });

  it('treats DELETE 200 with deleted:false as already absent', async () => {
    const res = await runShareDelete({
      ctx: minimalCtx(),
      kind: 'project',
      workerBaseUrl: 'https://worker.test',
      workerId: 'gone',
      remote: true,
      hooks: {
        deleteRemoteProject: async () => ({
          httpStatus: 200,
          body: { success: true, code: 'OK', data: { deleted: false }, errors: [] },
        }),
      },
    });
    expect(res.deletedRemote).toBe(true);
    expect(res.remoteAlreadyAbsent).toBe(true);
    expect(res.issues.some((i) => i.code === ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND && i.severity === 'warning')).toBe(
      true,
    );
  });

  it('succeeds when remote is already 404', async () => {
    const res = await runShareDelete({
      ctx: minimalCtx(),
      kind: 'project',
      workerBaseUrl: 'https://worker.test',
      workerId: 'gone',
      remote: true,
      hooks: {
        deleteRemoteProject: async () => ({
          httpStatus: 404,
          body: {
            success: false,
            errors: [{ code: 'PROJECT_NOT_FOUND', message: 'Project not found' }],
          },
        }),
      },
    });
    expect(res.deletedRemote).toBe(true);
    expect(res.remoteAlreadyAbsent).toBe(true);
    expect(res.issues.some((i) => i.code === ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND && i.severity === 'warning')).toBe(
      true,
    );
  });
});
