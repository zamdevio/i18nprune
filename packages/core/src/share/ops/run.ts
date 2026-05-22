import { emitRunEvent, emitRunMessage, nowMs } from '../../shared/run/index.js';
import {
  ISSUE_SHARE_REMOTE_ERROR,
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  ISSUE_SHARE_STALE_CACHE_ROW_REMOVED,
  ISSUE_SHARE_ZIP_FAILED,
} from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ShareCacheEntry, ShareKind } from '../../types/share/entry.js';
import type { ShareManifest, ShareProjectManifest } from '../../types/share/manifest.js';
import type { ShareRunInput, ShareRunResult } from '../../types/share/shareRun.js';
import type { ShareSkippedReason } from '../../types/share/shareRun.js';
import { buildProjectPayload, computeShareProjectConfigHash } from '../payload/buildProjectPayload.js';
import { prepareReportPayload } from '../../project/prepare/report.js';
import type { PrepareReportPayloadResult } from '../../types/report/ingest.js';
import { loadShareJsonFile, mergeDuplicateShareEntries, resolveShareJsonPath, saveShareJsonFile } from '../cache/io/shareJson.js';
import { buildProjectShareLinks, buildReportShareLinks } from '../util/links.js';
import {
  findMatchingProjectShareEntry,
  findMatchingProjectShareEntryByFilesEpoch,
  findMatchingReportShareEntry,
  normalizeWorkerBaseUrl,
} from '../policy/policy.js';
import { emitShareCacheDebug } from '../cache/debug.js';
import { resolveShareInputFilesEpoch } from '../cache/resolveInputFilesEpoch.js';
import { shareJsonBackupWarnMessage } from '../cache/shareJsonBackup.js';
import { parseWorkerShareEnvelope, shareRemoteIssueFromWorker, workerDataProjectId, workerDataReportId } from '../remote/remote.js';
import type { ShareHostHooks } from '../../types/share/shareRun.js';

function shareCacheDebug(hooks: ShareHostHooks, lines: Parameters<typeof emitShareCacheDebug>[0]['lines']): void {
  emitShareCacheDebug({
    emit: hooks.emit,
    runId: hooks.runId,
    enabled: hooks.debugCache === true,
    lines,
  });
}

export async function runShare(input: ShareRunInput): Promise<ShareRunResult> {
  const emit = input.hooks.emit;
  const runId = input.hooks.runId;
  const workerBaseUrl = normalizeWorkerBaseUrl(input.workerBaseUrl);
  const issues: Issue[] = [];
  const purgedStaleCacheRows: Array<{ kind: ShareKind; workerId: string }> = [];
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

  let shareFile: { version: 1; entries: ShareCacheEntry[] } = { version: 1, entries: [] };
  let sharePath: string | undefined;
  const cache = input.ctx.cache;
  const canUseShareJson =
    cache?.state.enabled === true && !cache.state.readOnly && cache.runtime !== undefined;

  if (canUseShareJson) {
    sharePath = resolveShareJsonPath(cache!.state.projectDir, cache!.runtime.path);
    const loaded = loadShareJsonFile({
      sharePath,
      runtime: cache!.runtime,
      cacheReadOnly: cache!.state.readOnly,
    });
    shareFile = loaded.file;
    issues.push(...loaded.issues);
    if (loaded.heal.backupBakPath) {
      emitRunMessage(input.hooks.emit, {
        op: 'share',
        runId: input.hooks.runId,
        level: 'warn',
        message: shareJsonBackupWarnMessage(loaded.heal.backupBakPath),
      });
    }
    shareCacheDebug(input.hooks, [
      { level: 'info', message: `share.json: ${sharePath}` },
      { level: 'detail', message: `  entries loaded: ${String(shareFile.entries.length)}` },
      ...(loaded.heal.backupBakPath
        ? [{ level: 'detail' as const, message: `  backup: ${loaded.heal.backupBakPath}` }]
        : []),
    ]);
  } else {
    shareCacheDebug(input.hooks, [
      {
        level: 'info',
        message:
          cache?.state.enabled === false
            ? 'share.json cache disabled (--no-cache or config)'
            : 'share.json cache read-only (no local share.json writes this run)',
      },
    ]);
  }

  let builtProject: Awaited<ReturnType<typeof buildProjectPayload>> | null = null;
  let builtReport: PrepareReportPayloadResult | null = null;
  let skipZipBuild = false;
  let payloadSkipReason: ShareSkippedReason = 'hash_unchanged';
  let epochCacheEntry: ShareCacheEntry | undefined;

  if (isProjectBuild && !input.force) {
    const configHash = computeShareProjectConfigHash(input.ctx);
    const inputFilesEpoch = resolveShareInputFilesEpoch(input.ctx);
    shareCacheDebug(input.hooks, [
      { level: 'detail', message: `  project configHash: ${configHash.slice(0, 12)}…` },
      {
        level: 'detail',
        message: `  files.json inputFilesEpoch: ${inputFilesEpoch ?? '(unavailable — cache off or no files.json)'}`,
      },
    ]);
    if (inputFilesEpoch) {
      epochCacheEntry = findMatchingProjectShareEntryByFilesEpoch(
        shareFile.entries,
        workerBaseUrl,
        configHash,
        inputFilesEpoch,
      );
      if (epochCacheEntry?.workerProjectId) {
        skipZipBuild = true;
        payloadSkipReason = 'cache_epoch_unchanged';
        shareCacheDebug(input.hooks, [
          {
            level: 'info',
            message: `share upload skip: cache_epoch_unchanged (worker project ${epochCacheEntry.workerProjectId})`,
          },
        ]);
      }
    }
  }

  if (isProjectBuild && !skipZipBuild) {
    builtProject = await buildProjectPayload({ ctx: input.ctx, projectRoot: input.projectRoot });
    if (!builtProject.ok) {
      emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
      return { action: 'skipped', kind: 'project', links: {}, workerIds: {}, issues: builtProject.issues };
    }
  }
  if (isReportDocument) {
    builtReport = await prepareReportPayload({ reportDocument: input.reportDocument });
    if (!builtReport.ok) {
      emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
      return { action: 'skipped', kind: 'report', links: {}, workerIds: {}, issues: builtReport.issues };
    }
  }

  const projectConfigHash = isProjectBuild ? computeShareProjectConfigHash(input.ctx) : '';

  const manifest: ShareManifest = isProjectBuild
    ? builtProject
      ? builtProject.manifest
      : ({
          kind: 'project',
          fileCount: 0,
          textFileCount: 0,
          byteSize: epochCacheEntry?.byteSize ?? 0,
          topLevelPrefixes: [],
          appliedZipIgnoresLabel: 'skipped — tracked files unchanged (project cache epoch)',
          payloadContentHash: epochCacheEntry?.payloadContentHash ?? '',
          configHash: projectConfigHash,
          detectedConfigRelPath: null,
        } satisfies ShareProjectManifest)
    : builtReport!.manifest;
  const projectManifest = manifest.kind === 'project' ? manifest : null;
  emitRunEvent(emit, {
    type: 'run.share.manifest',
    op: 'share',
    runId,
    at: stamp(),
    manifest,
  });

  let candidateEntry: ShareCacheEntry | undefined =
    isProjectBuild && skipZipBuild
      ? epochCacheEntry
      : isProjectBuild
        ? findMatchingProjectShareEntry(
            shareFile.entries,
            workerBaseUrl,
            manifest.payloadContentHash,
            projectManifest!.configHash,
          )
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
      const staleWorkerId =
        input.kind === 'project' ? candidateEntry?.workerProjectId : candidateEntry?.workerReportId;
      if (staleWorkerId) {
        purgedStaleCacheRows.push({ kind: input.kind, workerId: staleWorkerId });
      }
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
        code: ISSUE_SHARE_STALE_CACHE_ROW_REMOVED,
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

  if (!allowSkip && input.hooks.debugCache) {
    shareCacheDebug(input.hooks, [
      {
        level: 'info',
        message: input.force
          ? 'share upload: --force (skip policy ignored)'
          : `share upload: will upload (${isProjectBuild && skipZipBuild ? 'after zip skip cleared' : 'payload ready'})`,
      },
    ]);
  }

  if (allowSkip && candidateEntry) {
    shareCacheDebug(input.hooks, [
      {
        level: 'info',
        message: `share upload skip: ${payloadSkipReason} (worker ${input.kind} ${input.kind === 'project' ? candidateEntry.workerProjectId : candidateEntry.workerReportId})`,
      },
    ]);
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
          ? payloadSkipReason === 'cache_epoch_unchanged'
            ? 'unchanged tracked files (cache epoch) — reusing cached worker project id'
            : 'unchanged payload hash — reusing cached worker project id'
          : 'unchanged report findings hash — reusing cached worker report id',
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
      skippedReason: payloadSkipReason,
      ...(purgedStaleCacheRows.length > 0 ? { purgedStaleCacheRows } : {}),
    };
  }

  if (isProjectBuild && !builtProject) {
    builtProject = await buildProjectPayload({ ctx: input.ctx, projectRoot: input.projectRoot });
    if (!builtProject.ok) {
      emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
      return { action: 'skipped', kind: 'project', links: {}, workerIds: {}, issues: builtProject.issues };
    }
    if (projectManifest) {
      Object.assign(projectManifest, builtProject.manifest);
    }
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
          ? projectManifest!.fileCount > 0
            ? `Upload this snapshot (${String(projectManifest!.fileCount)} files, ${String(manifest.byteSize)} bytes) to ${workerBaseUrl}?`
            : `Upload this snapshot (${String(manifest.byteSize)} bytes) to ${workerBaseUrl}?`
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
  const projectInputFilesEpoch =
    input.kind === 'project' ? resolveShareInputFilesEpoch(input.ctx) : undefined;
  const newEntry: ShareCacheEntry = {
    kind: input.kind,
    workerBaseUrl,
    ...(input.kind === 'project'
      ? {
          workerProjectId: workerId,
          configHash: projectManifest!.configHash,
          ...(projectInputFilesEpoch !== undefined ? { inputFilesEpoch: projectInputFilesEpoch } : {}),
        }
      : { workerReportId: workerId }),
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
    ...(purgedStaleCacheRows.length > 0 ? { purgedStaleCacheRows } : {}),
  };
}
