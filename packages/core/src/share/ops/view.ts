import { ISSUE_SHARE_STALE_CACHE_ROW_REMOVED } from '../../shared/constants/issueCodes.js';
import type { ShareCacheEntry, ShareLinks } from '../../types/share/entry.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ShareViewInput, ShareViewResult } from '../../types/share/shareRun.js';
import { loadShareJsonFile, resolveShareJsonPath } from '../cache/io/shareJson.js';
import { purgeShareCacheEntry } from '../cache/purgeCacheEntry.js';
import { buildProjectShareLinks, buildReportShareLinks } from '../util/links.js';
import {
  parseWorkerProjectStoredMetadata,
  parseWorkerReportStoredMetadata,
} from '../remote/parseMetadata.js';
import { isShareRemoteNotFoundIssue, parseWorkerShareEnvelope, shareRemoteIssueFromWorker } from '../remote/remote.js';

function pickLocalEntry(input: ShareViewInput, entries: ShareCacheEntry[]): ShareCacheEntry | undefined {
  return entries.find((e) =>
    input.kind === 'project'
      ? e.kind === 'project' && e.workerProjectId === input.workerId
      : e.kind === 'report' && e.workerReportId === input.workerId,
  );
}

function mergeLinks(remoteLinks: ShareLinks, local?: ShareCacheEntry): ShareLinks {
  if (!local) return remoteLinks;
  return { ...local.links, ...remoteLinks };
}

/** Fetches worker metadata for one share id and overlays local `share.json` data when available. */
export async function runShareView(input: ShareViewInput): Promise<ShareViewResult> {
  const issues: Issue[] = [];
  let local: ShareCacheEntry | undefined;
  const cache = input.ctx.cache;
  if (cache?.state.enabled && cache.runtime) {
    const sharePath = resolveShareJsonPath(cache.state.projectDir, cache.runtime.path);
    const loaded = loadShareJsonFile({
      sharePath,
      runtime: cache.runtime,
      cacheReadOnly: cache.state.readOnly,
    });
    issues.push(...loaded.issues);
    local = pickLocalEntry(input, loaded.file.entries);
  }

  const response =
    input.kind === 'project'
      ? input.hooks.fetchRemoteProjectRow
        ? await input.hooks.fetchRemoteProjectRow({ workerBaseUrl: input.workerBaseUrl, projectId: input.workerId })
        : null
      : input.hooks.fetchRemoteReportRow
        ? await input.hooks.fetchRemoteReportRow({ workerBaseUrl: input.workerBaseUrl, reportId: input.workerId })
        : null;

  if (!response) {
    return {
      kind: input.kind,
      workerId: input.workerId,
      local,
      links:
        input.kind === 'project'
          ? buildProjectShareLinks({ workerBaseUrl: input.workerBaseUrl, projectId: input.workerId })
          : buildReportShareLinks({ workerBaseUrl: input.workerBaseUrl, reportId: input.workerId }),
      issues,
    };
  }

  const envelope = parseWorkerShareEnvelope(response.body);
  const remoteIssue = shareRemoteIssueFromWorker({ httpStatus: response.httpStatus, envelope });
  let purgedLocalCache = false;

  if (remoteIssue && isShareRemoteNotFoundIssue(remoteIssue)) {
    issues.push({ ...remoteIssue, severity: 'warning' });
    if (input.purgeStaleLocalOnNotFound !== false) {
      const purged = purgeShareCacheEntry({
        ctx: input.ctx,
        kind: input.kind,
        workerId: input.workerId,
        workerBaseUrl: input.workerBaseUrl,
      });
      issues.push(...purged.issues);
      if (purged.purged) {
        purgedLocalCache = true;
        local = undefined;
        issues.push({
          severity: 'warning',
          code: ISSUE_SHARE_STALE_CACHE_ROW_REMOVED,
          message:
            input.kind === 'project'
              ? 'Removed stale share.json project row after the worker reported the project is gone.'
              : 'Removed stale share.json report row after the worker reported the report is gone.',
        });
      }
    }
  } else if (remoteIssue) {
    issues.push(remoteIssue);
  }

  const remoteLinks =
    input.kind === 'project'
      ? buildProjectShareLinks({ workerBaseUrl: input.workerBaseUrl, projectId: input.workerId })
      : buildReportShareLinks({ workerBaseUrl: input.workerBaseUrl, reportId: input.workerId });

  const remote = envelope.success ? envelope.data : undefined;
  const remoteMetadata =
    input.kind === 'project'
      ? parseWorkerProjectStoredMetadata(remote)
      : parseWorkerReportStoredMetadata(remote);

  return {
    kind: input.kind,
    workerId: input.workerId,
    remote,
    ...(remoteMetadata !== undefined ? { remoteMetadata } : {}),
    local,
    links: mergeLinks(remoteLinks, local),
    issues,
    ...(purgedLocalCache ? { purgedLocalCache: true } : {}),
  };
}
