import { emitRunEvent, nowMs } from '../shared/run/index.js';
import {
  ISSUE_SHARE_REMOTE_ERROR,
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_ZIP_FAILED,
} from '../shared/constants/issueCodes.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { ShareCacheEntry } from '../types/share/entry.js';
import type { ShareRunInput, ShareRunResult } from '../types/share/shareRun.js';
import { buildProjectPayload } from './buildProjectPayload.js';
import { loadShareJsonFile, mergeDuplicateShareEntries, resolveShareJsonPath, saveShareJsonFile } from './io/shareJson.js';
import { buildProjectShareLinks } from './links.js';
import { findMatchingProjectShareEntry, normalizeWorkerBaseUrl } from './policy.js';
import { parseWorkerShareEnvelope, shareRemoteIssueFromWorker, workerDataProjectId } from './remote.js';

export async function runShare(input: ShareRunInput): Promise<ShareRunResult> {
  const emit = input.hooks.emit;
  const runId = input.hooks.runId;
  const workerBaseUrl = normalizeWorkerBaseUrl(input.workerBaseUrl);
  const issues: Issue[] = [];
  const stamp = () => nowMs();

  emitRunEvent(emit, { type: 'run.started', op: 'share', runId, at: stamp() });

  if (input.kind === 'project' && input.source === 'worker-ref') {
    const ref = input.workerRef;
    const links = buildProjectShareLinks({
      workerBaseUrl: normalizeWorkerBaseUrl(ref.workerBaseUrl),
      projectId: ref.workerProjectId,
    });
    emitRunEvent(emit, { type: 'run.share.links', op: 'share', runId, at: stamp(), links });
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });
    return {
      action: 'link-only',
      kind: 'project',
      links,
      workerIds: { projectId: ref.workerProjectId },
      issues,
      skippedReason: 'worker_ref_link_only',
    };
  }

  if (input.kind !== 'project' || input.source !== 'build') {
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return {
      action: 'skipped',
      kind: 'project',
      links: {},
      workerIds: {},
      issues: [
        {
          severity: 'error',
          code: ISSUE_SHARE_ZIP_FAILED,
          message: 'Unsupported share run (expected project + source "build").',
        },
      ],
    };
  }

  const built = await buildProjectPayload({ ctx: input.ctx, projectRoot: input.projectRoot });
  if (!built.ok) {
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return { action: 'skipped', kind: 'project', links: {}, workerIds: {}, issues: built.issues };
  }

  const { manifest, zipBytes } = built;
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

  const candidateEntry = findMatchingProjectShareEntry(
    shareFile.entries,
    workerBaseUrl,
    manifest.payloadContentHash,
    manifest.configHash,
  );

  let allowSkip = !input.force && Boolean(candidateEntry?.workerProjectId);

  if (allowSkip && candidateEntry?.workerProjectId && input.hooks.fetchRemoteProjectRow) {
    const resp = await input.hooks.fetchRemoteProjectRow({
      workerBaseUrl,
      projectId: candidateEntry.workerProjectId,
    });
    const env = parseWorkerShareEnvelope(resp.body);
    const remoteIssue = shareRemoteIssueFromWorker({ httpStatus: resp.httpStatus, envelope: env });
    if (remoteIssue?.code === ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND) {
      allowSkip = false;
      shareFile.entries = shareFile.entries.filter(
        (e) =>
          !(
            e.kind === 'project' &&
            e.workerProjectId === candidateEntry.workerProjectId &&
            normalizeWorkerBaseUrl(e.workerBaseUrl) === workerBaseUrl
          ),
      );
      if (canUseShareJson && sharePath && cache?.runtime) {
        const w = saveShareJsonFile({ sharePath, file: shareFile, runtime: cache.runtime });
        if (w.warning) issues.push(w.warning);
      }
      issues.push({
        severity: 'warning',
        code: ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
        message:
          'Cached project link no longer exists on the worker (eviction or wrong id). Removed the stale share.json row; uploading a fresh snapshot.',
      });
    } else if (remoteIssue) {
      allowSkip = false;
    }
  } else if (!input.force && candidateEntry?.workerProjectId && !input.hooks.fetchRemoteProjectRow) {
    allowSkip = false;
  }

  if (allowSkip && candidateEntry?.workerProjectId) {
    const links = candidateEntry.links;
    const nowIso = new Date().toISOString();
    const idx = shareFile.entries.findIndex(
      (e) =>
        e.kind === 'project' &&
        e.workerProjectId === candidateEntry.workerProjectId &&
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
      reason: 'unchanged payload hash — reusing cached worker project id',
      links,
      workerIds: { projectId: candidateEntry.workerProjectId },
    });
    emitRunEvent(emit, { type: 'run.share.links', op: 'share', runId, at: stamp(), links });
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });
    return {
      action: 'skipped',
      kind: 'project',
      manifest,
      links,
      workerIds: { projectId: candidateEntry.workerProjectId },
      cacheEntry: idx >= 0 ? shareFile.entries[idx]! : candidateEntry,
      issues,
      skippedReason: 'hash_unchanged',
    };
  }

  if (input.hooks.dryRun) {
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });
    return {
      action: 'skipped',
      kind: 'project',
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
      message: `Upload this snapshot (${String(manifest.fileCount)} files, ${String(manifest.byteSize)} bytes) to ${workerBaseUrl}?`,
      defaultValue: true,
    });
    if (!ok) {
      emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });
      return {
        action: 'skipped',
        kind: 'project',
        manifest,
        links: {},
        workerIds: {},
        issues,
        skippedReason: 'user_cancelled_confirm',
      };
    }
  }

  if (!input.hooks.uploadProject) {
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return {
      action: 'skipped',
      kind: 'project',
      manifest,
      links: {},
      workerIds: {},
      issues: [
        {
          severity: 'error',
          code: ISSUE_SHARE_REMOTE_ERROR,
          message: 'Missing host hook `uploadProject` — cannot complete share upload.',
        },
      ],
    };
  }

  const up = await input.hooks.uploadProject({ workerBaseUrl, zipBytes });
  const env = parseWorkerShareEnvelope(up.body);
  const remoteIssue = shareRemoteIssueFromWorker({ httpStatus: up.httpStatus, envelope: env });
  if (remoteIssue) {
    issues.push(remoteIssue);
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return { action: 'skipped', kind: 'project', manifest, links: {}, workerIds: {}, issues };
  }

  const projectId = workerDataProjectId(env.data);
  if (!projectId) {
    issues.push({
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_ERROR,
      message: 'Worker upload succeeded but the response did not include a projectId.',
    });
    emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: false });
    return { action: 'skipped', kind: 'project', manifest, links: {}, workerIds: {}, issues };
  }

  const links = buildProjectShareLinks({ workerBaseUrl, projectId });
  const nowIso = new Date().toISOString();
  const newEntry: ShareCacheEntry = {
    kind: 'project',
    workerBaseUrl,
    workerProjectId: projectId,
    payloadContentHash: manifest.payloadContentHash,
    configHash: manifest.configHash,
    byteSize: zipBytes.byteLength,
    uploadedAt: nowIso,
    lastUsedAt: nowIso,
    links,
  };

  if (canUseShareJson && sharePath && cache?.runtime) {
    const filtered = shareFile.entries.filter((e) => !(e.kind === 'project' && e.workerProjectId === projectId));
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
    kind: 'project',
    workerProjectId: projectId,
    byteSize: zipBytes.byteLength,
  });
  emitRunEvent(emit, { type: 'run.share.links', op: 'share', runId, at: stamp(), links });
  emitRunEvent(emit, { type: 'run.completed', op: 'share', runId, at: stamp(), ok: true });

  return {
    action: 'uploaded',
    kind: 'project',
    manifest,
    links,
    workerIds: { projectId },
    cacheEntry: canUseShareJson ? newEntry : undefined,
    issues,
  };
}
