import {
  ISSUE_SHARE_CACHE_ENTRY_NOT_FOUND,
  ISSUE_SHARE_REMOTE_ERROR,
} from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ShareDeleteInput, ShareDeleteResult } from '../../types/share/shareRun.js';
import { loadShareJsonFile, resolveShareJsonPath, saveShareJsonFile } from '../cache/io/shareJson.js';
import { parseWorkerShareEnvelope, resolveShareRemoteDeleteOutcome } from '../remote/remote.js';

/** Deletes one local share entry and optionally deletes the remote worker row. */
export async function runShareDelete(input: ShareDeleteInput): Promise<ShareDeleteResult> {
  const issues: Issue[] = [];
  let deletedLocal = false;
  let deletedRemote = false;
  let remoteAlreadyAbsent = false;

  const cache = input.ctx.cache;
  if (cache?.state.enabled && cache.runtime) {
    const sharePath = resolveShareJsonPath(cache.state.projectDir, cache.runtime.path);
    const loaded = loadShareJsonFile({
      sharePath,
      runtime: cache.runtime,
      cacheReadOnly: cache.state.readOnly,
    });
    issues.push(...loaded.issues);
    const before = loaded.file.entries.length;
    const entries = loaded.file.entries.filter((e) =>
      input.kind === 'project'
        ? !(e.kind === 'project' && e.workerProjectId === input.workerId)
        : !(e.kind === 'report' && e.workerReportId === input.workerId),
    );
    deletedLocal = entries.length !== before;
    if (deletedLocal) {
      const saved = saveShareJsonFile({ sharePath, runtime: cache.runtime, file: { version: 1, entries } });
      if (saved.warning) issues.push(saved.warning);
    }
  }

  const deleteRemote = input.remote !== false;
  if (!deletedLocal) {
    const label = input.kind === 'project' ? 'project' : 'report';
    issues.push({
      severity: 'warning',
      code: ISSUE_SHARE_CACHE_ENTRY_NOT_FOUND,
      message: deleteRemote
        ? `No matching ${label} id in share.json (${input.workerId}); continuing with worker DELETE.`
        : `No matching ${label} id in share.json (${input.workerId}).`,
    });
  }

  if (deleteRemote) {
    const response =
      input.kind === 'project'
        ? input.hooks?.deleteRemoteProject
          ? await input.hooks.deleteRemoteProject({ workerBaseUrl: input.workerBaseUrl, projectId: input.workerId })
          : null
        : input.hooks?.deleteRemoteReport
          ? await input.hooks.deleteRemoteReport({ workerBaseUrl: input.workerBaseUrl, reportId: input.workerId })
          : null;

    if (!response) {
      issues.push({
        severity: 'error',
        code: ISSUE_SHARE_REMOTE_ERROR,
        message:
          input.kind === 'project'
            ? 'Missing host hook `deleteRemoteProject` — cannot DELETE the worker project row.'
            : 'Missing host hook `deleteRemoteReport` — cannot DELETE the worker report row.',
      });
    } else {
      const env = parseWorkerShareEnvelope(response.body);
      const outcome = resolveShareRemoteDeleteOutcome({
        httpStatus: response.httpStatus,
        envelope: env,
        kind: input.kind,
      });
      deletedRemote = outcome.deletedRemote;
      remoteAlreadyAbsent = outcome.alreadyAbsent;
      if (outcome.issue) issues.push(outcome.issue);
    }
  }

  return { deletedLocal, deletedRemote, remoteAlreadyAbsent, issues };
}
