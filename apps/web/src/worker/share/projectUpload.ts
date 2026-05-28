import {
  buildHostedProjectShareArtifacts,
  buildHostedProjectUploadRequest,
  ISSUE_SHARE_REMOTE_ERROR,
  parseWorkerShareEnvelope,
  prepareProjectSnapshotFromArchive,
  shareRemoteIssueFromWorker,
  workerDataProjectId,
  workerProjectArchiveIngestUrl,
  workerUploadWasDeduped,
  type ProjectUploadSnapshotMeta,
} from '@i18nprune/core';
import { webPathRuntime } from '@i18nprune/core/runtime/web';
import { hex16Id, sha256Hex, createWebShareCoreContext, webProcessorContext } from '../../project/index.js';
import type { ProjectIngestMode, ProjectUploadMeta, ProjectUploadResult } from '../../types/index.js';
import { workerFetchJson, zipBytesToArrayBuffer } from './workerHttp.js';

function metadataScalarIso(value: string | number | null | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function uploadMetaFromSnapshotMeta(meta: ProjectUploadSnapshotMeta | undefined): ProjectUploadMeta {
  if (!meta) return {};
  const timing = meta.timing;
  const preparedAt =
    metadataScalarIso(timing?.preparedAt) ?? metadataScalarIso(timing?.storedAt);
  const extractionComputedAt = metadataScalarIso(timing?.extraction?.computedAt);
  return { preparedAt, extractionComputedAt };
}

function snapshotMetaFromEnvelopeData(data: unknown): ProjectUploadSnapshotMeta | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const meta = (data as Record<string, unknown>).snapshotMeta;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return undefined;
  return meta as ProjectUploadSnapshotMeta;
}

/**
 * Upload a project zip to the worker — **prepared** JSON ingest (default) or **archive** multipart (worker prepare).
 */
export async function uploadProjectToWorker(input: {
  workerBaseUrl: string;
  zipBytes: Uint8Array;
  zipFileName: string;
  configJson?: string;
  ingestMode?: ProjectIngestMode;
  /** Replace prior worker row for the same payload hash (config override re-upload). */
  force?: boolean;
}): Promise<ProjectUploadResult> {
  const ingestMode = input.ingestMode ?? 'prepared';
  const workerBaseUrl = input.workerBaseUrl.replace(/\/$/, '');

  if (ingestMode === 'archive') {
    const form = new FormData();
    form.set(
      'archive',
      new Blob([zipBytesToArrayBuffer(input.zipBytes)], { type: 'application/zip' }),
      input.zipFileName,
    );
    const cfg = input.configJson?.trim();
    if (cfg && cfg.length > 0) form.set('configJson', cfg);

    const { httpStatus, body } = await workerFetchJson(
      workerProjectArchiveIngestUrl(workerBaseUrl, input.force),
      {
        method: 'POST',
        body: form,
      },
    );
    const envelope = parseWorkerShareEnvelope(body);
    const issue = shareRemoteIssueFromWorker({ httpStatus, envelope });
    if (issue) return { ok: false, issue };

    const projectId = workerDataProjectId(envelope.data);
    if (!projectId) {
      return {
        ok: false,
        issue: {
          severity: 'error',
          code: ISSUE_SHARE_REMOTE_ERROR,
          message: 'Upload succeeded but projectId was missing.',
        },
      };
    }
    return {
      ok: true,
      projectId,
      uploadMeta: uploadMetaFromSnapshotMeta(snapshotMetaFromEnvelopeData(envelope.data)),
      deduped: workerUploadWasDeduped(envelope),
    };
  }

  const projectId = hex16Id();
  const projectHash = await sha256Hex(input.zipBytes);
  const prepared = await prepareProjectSnapshotFromArchive({
    projectId,
    projectHash,
    zipBytes: input.zipBytes,
    path: webPathRuntime,
    configJson: input.configJson,
    prepareHost: 'web',
  });
  if (!prepared.ok) {
    const first = prepared.issues[0];
    return {
      ok: false,
      issue: first ?? {
        severity: 'error',
        code: ISSUE_SHARE_REMOTE_ERROR,
        message: 'Failed to prepare project snapshot in the browser.',
      },
    };
  }

  const built = await buildHostedProjectShareArtifacts({
    ctx: createWebShareCoreContext(),
    prepare: prepared,
    processorContext: webProcessorContext('prepared'),
  });
  if (!built.ok) {
    const first = built.issues[0];
    return {
      ok: false,
      issue: first ?? {
        severity: 'error',
        code: ISSUE_SHARE_REMOTE_ERROR,
        message: 'Prepared project snapshot exceeds worker size limits.',
      },
    };
  }

  const req = buildHostedProjectUploadRequest({
    workerBaseUrl,
    envelope: built.envelope,
    serialized: built.serialized,
    force: input.force,
  });

  const { httpStatus, body } = await workerFetchJson(req.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: req.body,
  });
  const envelope = parseWorkerShareEnvelope(body);
  const issue = shareRemoteIssueFromWorker({ httpStatus, envelope });
  if (issue) return { ok: false, issue };

  const uploadedId = workerDataProjectId(envelope.data);
  if (!uploadedId) {
    return {
      ok: false,
      issue: {
        severity: 'error',
        code: ISSUE_SHARE_REMOTE_ERROR,
        message: 'Upload succeeded but projectId was missing.',
      },
    };
  }

  return {
    ok: true,
    projectId: uploadedId,
    uploadMeta: uploadMetaFromSnapshotMeta(snapshotMetaFromEnvelopeData(envelope.data)),
    deduped: workerUploadWasDeduped(envelope),
  };
}
