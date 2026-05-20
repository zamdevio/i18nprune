import { emitRunEvent, nowMs } from '../shared/run/index.js';
import {
  ISSUE_SHARE_REMOTE_ERROR,
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  ISSUE_SHARE_ZIP_FAILED,
} from '../shared/constants/issueCodes.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { ShareCacheEntry } from '../types/share/entry.js';
import type { ShareManifest } from '../types/share/manifest.js';
import type { ShareRunInput, ShareRunResult } from '../types/share/shareRun.js';
import { buildProjectPayload } from './buildProjectPayload.js';
import { buildReportPayload } from './buildReportPayload.js';
import { loadShareJsonFile, mergeDuplicateShareEntries, resolveShareJsonPath, saveShareJsonFile } from './io/shareJson.js';
import { buildProjectShareLinks, buildReportShareLinks } from './links.js';
import { findMatchingProjectShareEntry, findMatchingReportShareEntry, normalizeWorkerBaseUrl } from './policy.js';
import { parseWorkerShareEnvelope, shareRemoteIssueFromWorker, workerDataProjectId, workerDataReportId } from './remote.js';

export async function runShare(input: ShareRunInput): Promise<ShareRunResult> {
  const emit = input.hooks.emit;
  const runId = input.hooks.runId;
  const workerBaseUrl = normalizeWorkerBaseUrl(input.workerBaseUrl);
  const issues: Issue[] = [];
  const stamp = () => nowMs();

  emitRunEvent(emit, { type: 'run.started', op: 'share', runId, at: stamp() });

  if (input.source === 'worker-ref') {
    const links =
      input.kind === 'project'
        ? buildProjectShareLinks({
            workerBaseUrl: normalizeWorkerBaseUrl(input.workerRef.workerBaseUrl),
            projectId: input.workerRef.workerProjectId,
          })
        : buildReportShareLinks({
            workerBaseUrl: normalizeWorkerBaseUrl(input.workerRef.workerBaseUrl),
            reportId: input.workerRef.workerReportId,
          });
    emitRunEvent(emit, { type: 'run.share.links', op: 'share', runId, at: stamp(), links });
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });
    return {
      action: 'link-only',
      kind: input.kind,
      links,
      workerIds:
        input.kind === 'project'
          ? { projectId: input.workerRef.workerProjectId }
          : { reportId: input.workerRef.workerReportId },
      issues,
      skippedReason: 'worker_ref_link_only',
    };
  }

  const isProjectBuild = input.kind === 'project' && input.source === 'build';
  const isReportDocument = input.kind === 'report' && input.source === 'document';
  if (!isProjectBuild && !isReportDocument) {
    const _exhaustive: never = input;
    void _exhaustive;
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return {
      action: 'skipped',
      kind: 'project',
      links: {},
      workerIds: {},
      issues: [{ severity: 'error', code: ISSUE_SHARE_ZIP_FAILED, message: 'Unsupported share run input.' }],
    };
  }

  const builtProject = isProjectBuild ? await buildProjectPayload({ ctx: input.ctx, projectRoot: input.projectRoot }) : null;
  if (builtProject && !builtProject.ok) {
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return { action: 'skipped', kind: 'project', links: {}, workerIds: {}, issues: builtProject.issues };
  }
  const builtReport = isReportDocument ? await buildReportPayload({ reportDocument: input.reportDocument }) : null;
  if (builtReport && !builtReport.ok) {
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return { action: 'skipped', kind: 'report', links: {}, workerIds: {}, issues: builtReport.issues };
  }
  const manifest: ShareManifest = isProjectBuild ? builtProject!.manifest : builtReport!.manifest;
  const projectManifest = manifest.kind === 'project' ? manifest : null;
  emitRunEvent(emit, {
    type: 'run.share.manifest',
    op: 'share',
    runId,
    at: stamp(),
    manifest,
  });

  let shareFile: { version: 1; entries: ShareCacheEntry[] } = { version: 1, entries: [] };
  let sharePath: string | undefined;
  const cache = input.ctx.cache;
  const canUseShareJson =
    cache?.state.enabled === true && !cache.state.readOnly && cache.runtime !== undefined;

  if (canUseShareJson) {
    sharePath = resolveShareJsonPath(cache.state.projectDir, cache.runtime.path);
    const loaded = loadShareJsonFile({ sharePath, runtime: cache.runtime });
    shareFile = loaded.file;
    issues.push(...loaded.issues);
  }

  const candidateEntry =
    input.kind === 'project'
      ? findMatchingProjectShareEntry(shareFile.entries, workerBaseUrl, manifest.payloadContentHash, projectManifest!.configHash)
      : findMatchingReportShareEntry(shareFile.entries, workerBaseUrl, manifest.payloadContentHash);

  let allowSkip = !input.force && (input.kind === 'project' ? Boolean(candidateEntry?.workerProjectId) : Boolean(candidateEntry?.workerReportId));

  if (
    allowSkip &&
    ((input.kind === 'project' && candidateEntry?.workerProjectId && input.hooks.fetchRemoteProjectRow) ||
      (input.kind === 'report' && candidateEntry?.workerReportId && input.hooks.fetchRemoteReportRow))
  ) {
    const resp =
      input.kind === 'project'
        ? await input.hooks.fetchRemoteProjectRow!({ workerBaseUrl, projectId: candidateEntry!.workerProjectId! })
        : await input.hooks.fetchRemoteReportRow!({ workerBaseUrl, reportId: candidateEntry!.workerReportId! });
    const env = parseWorkerShareEnvelope(resp.body);
    const remoteIssue = shareRemoteIssueFromWorker({ httpStatus: resp.httpStatus, envelope: env });
    const notFoundCode = input.kind === 'project' ? ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND : ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND;
    if (remoteIssue?.code === notFoundCode) {
      allowSkip = false;
      shareFile.entries = shareFile.entries.filter(
        (e) =>
          !(
            e.kind === input.kind &&
            (input.kind === 'project'
              ? e.workerProjectId === candidateEntry?.workerProjectId
              : e.workerReportId === candidateEntry?.workerReportId) &&
            normalizeWorkerBaseUrl(e.workerBaseUrl) === workerBaseUrl
          ),
      );
      if (canUseShareJson && sharePath && cache?.runtime) {
        const w = saveShareJsonFile({ sharePath, file: shareFile, runtime: cache.runtime });
        if (w.warning) issues.push(w.warning);
      }
      issues.push({
        severity: 'warning',
        code: notFoundCode,
        message:
          input.kind === 'project'
            ? 'Cached project link no longer exists on the worker (eviction or wrong id). Removed the stale share.json row; uploading a fresh snapshot.'
            : 'Cached report link no longer exists on the worker (eviction or wrong id). Removed the stale share.json row; uploading a fresh payload.',
      });
    } else if (remoteIssue) {
      allowSkip = false;
    }
  } else if (
    !input.force &&
    ((input.kind === 'project' && candidateEntry?.workerProjectId && !input.hooks.fetchRemoteProjectRow) ||
      (input.kind === 'report' && candidateEntry?.workerReportId && !input.hooks.fetchRemoteReportRow))
  ) {
    allowSkip = false;
  }

  if (allowSkip && candidateEntry) {
    const links = candidateEntry.links;
    const nowIso = new Date().toISOString();
    const idx = shareFile.entries.findIndex(
      (e) =>
        e.kind === input.kind &&
        (input.kind === 'project'
          ? e.workerProjectId === candidateEntry.workerProjectId
          : e.workerReportId === candidateEntry.workerReportId) &&
        normalizeWorkerBaseUrl(e.workerBaseUrl) === workerBaseUrl,
    );
    if (idx >= 0) {
      const prev = shareFile.entries[idx];
      if (prev) {
        shareFile.entries[idx] = { ...prev, lastUsedAt: nowIso };
        if (canUseShareJson && sharePath && cache?.runtime) {
          const w = saveShareJsonFile({ sharePath, file: shareFile, runtime: cache.runtime });
          if (w.warning) issues.push(w.warning);
        }
      }
    }

    emitRunEvent(emit, {
      type: 'run.share.skipped',
      op: 'share',
      runId,
      at: stamp(),
      reason:
        input.kind === 'project'
          ? 'unchanged payload hash — reusing cached worker project id'
          : 'unchanged payload hash — reusing cached worker report id',
      links,
      workerIds:
        input.kind === 'project'
          ? { projectId: candidateEntry.workerProjectId }
          : { reportId: candidateEntry.workerReportId },
    });
    emitRunEvent(emit, { type: 'run.share.links', op: 'share', runId, at: stamp(), links });
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });
    return {
      action: 'skipped',
      kind: input.kind,
      manifest,
      links,
      workerIds:
        input.kind === 'project'
          ? { projectId: candidateEntry.workerProjectId }
          : { reportId: candidateEntry.workerReportId },
      cacheEntry: idx >= 0 ? shareFile.entries[idx]! : candidateEntry,
      issues,
      skippedReason: 'hash_unchanged',
    };
  }

  if (input.hooks.dryRun) {
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });
    return {
      action: 'skipped',
      kind: input.kind,
      manifest,
      links: {},
      workerIds: {},
      issues,
      skippedReason: 'dry_run',
    };
  }

  const interactive = input.hooks.interactive !== false;
  if (interactive && input.hooks.confirmUpload) {
    const ok = await input.hooks.confirmUpload({
      message:
        input.kind === 'project'
          ? `Upload this snapshot (${String(projectManifest!.fileCount)} files, ${String(manifest.byteSize)} bytes) to ${workerBaseUrl}?`
          : `Upload this report (${String(manifest.byteSize)} bytes) to ${workerBaseUrl}?`,
      defaultValue: true,
    });
    if (!ok) {
      emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });
      return {
        action: 'skipped',
        kind: input.kind,
        manifest,
        links: {},
        workerIds: {},
        issues,
        skippedReason: 'user_cancelled_confirm',
      };
    }
  }

  if ((input.kind === 'project' && !input.hooks.uploadProject) || (input.kind === 'report' && !input.hooks.uploadReport)) {
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return {
      action: 'skipped',
      kind: input.kind,
      manifest,
      links: {},
      workerIds: {},
      issues: [
        {
          severity: 'error',
          code: ISSUE_SHARE_REMOTE_ERROR,
          message:
            input.kind === 'project'
              ? 'Missing host hook `uploadProject` — cannot complete share upload.'
              : 'Missing host hook `uploadReport` — cannot complete share upload.',
        },
      ],
    };
  }

  const up =
    input.kind === 'project'
      ? await input.hooks.uploadProject!({ workerBaseUrl, zipBytes: builtProject!.zipBytes })
      : await input.hooks.uploadReport!({ workerBaseUrl, document: builtReport!.document });
  const env = parseWorkerShareEnvelope(up.body);
  const remoteIssue = shareRemoteIssueFromWorker({ httpStatus: up.httpStatus, envelope: env });
  if (remoteIssue) {
    issues.push(remoteIssue);
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return { action: 'skipped', kind: input.kind, manifest, links: {}, workerIds: {}, issues };
  }

  const workerId = input.kind === 'project' ? workerDataProjectId(env.data) : workerDataReportId(env.data);
  if (!workerId) {
    issues.push({
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_ERROR,
      message:
        input.kind === 'project'
          ? 'Worker upload succeeded but the response did not include a projectId.'
          : 'Worker upload succeeded but the response did not include a reportId.',
    });
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return { action: 'skipped', kind: input.kind, manifest, links: {}, workerIds: {}, issues };
  }

  const links =
    input.kind === 'project'
      ? buildProjectShareLinks({ workerBaseUrl, projectId: workerId })
      : buildReportShareLinks({ workerBaseUrl, reportId: workerId });
  const nowIso = new Date().toISOString();
  const newEntry: ShareCacheEntry = {
    kind: input.kind,
    workerBaseUrl,
    ...(input.kind === 'project' ? { workerProjectId: workerId, configHash: projectManifest!.configHash } : { workerReportId: workerId }),
    payloadContentHash: manifest.payloadContentHash,
    byteSize: manifest.byteSize,
    uploadedAt: nowIso,
    lastUsedAt: nowIso,
    links,
  };

  if (canUseShareJson && sharePath && cache?.runtime) {
    const filtered = shareFile.entries.filter((e) =>
      input.kind === 'project'
        ? !(e.kind === 'project' && e.workerProjectId === workerId)
        : !(e.kind === 'report' && e.workerReportId === workerId),
    );
    const nextEntries = mergeDuplicateShareEntries([...filtered, newEntry]).entries;
    shareFile = { version: 1, entries: nextEntries };
    const w = saveShareJsonFile({ sharePath, file: shareFile, runtime: cache.runtime });
    if (w.warning) issues.push(w.warning);
  }

  emitRunEvent(emit, {
    type: 'run.share.uploaded',
    op: 'share',
    runId,
    at: stamp(),
    kind: input.kind,
    ...(input.kind === 'project' ? { workerProjectId: workerId } : { workerReportId: workerId }),
    byteSize: manifest.byteSize,
  });
  emitRunEvent(emit, { type: 'run.share.links', op: 'share', runId, at: stamp(), links });
  emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });

  return {
    action: 'uploaded',
    kind: input.kind,
    manifest,
    links,
    workerIds: input.kind === 'project' ? { projectId: workerId } : { reportId: workerId },
    cacheEntry: canUseShareJson ? newEntry : undefined,
    issues,
  };
}
