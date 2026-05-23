import {
  emitShareUploadHumanMessages,
  ISSUE_SHARE_REMOTE_ERROR,
  parseWorkerShareEnvelope,
  resolveShareWorkerBaseUrl,
  shareRemoteIssueFromWorker,
  type Issue,
  type RunEmitter,
  type ShareRunResult,
  type WorkspaceSession,
} from '@i18nprune/core';
import { buildWebWorkspaceShareUrl } from '../../../hooks/useAppRoute.js';
import { workerFetchJson, zipBytesToArrayBuffer } from './workerHttp';
import { fetchWorkerProjectMetadata } from './workerFetch';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function workerProjectIdFromEnvelope(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const id = (data as Record<string, unknown>).projectId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

function collectShareHumanLines(result: ShareRunResult): string[] {
  const lines: string[] = [];
  const emit: RunEmitter = (event) => {
    if (event.type === 'run.message') lines.push(event.message);
  };
  emitShareUploadHumanMessages({ emit }, result);
  return lines;
}

export type WebShareProjectOutcome =
  | { ok: true; result: ShareRunResult; humanLines: string[] }
  | { ok: false; issues: Issue[]; humanLines: string[] };

/** Link-only share when the workspace session is already on the worker (same as core `runShare` worker-ref). */
export async function shareRemoteProjectLinkOnly(input: {
  workerBaseUrl: string;
  projectId: string;
}): Promise<WebShareProjectOutcome> {
  const workerBaseUrl = resolveShareWorkerBaseUrl(input.workerBaseUrl);
  const links = {
    web: buildWebWorkspaceShareUrl(input.projectId),
    worker: `${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(input.projectId)}`,
  };
  const result: ShareRunResult = {
    action: 'link-only',
    kind: 'project',
    links,
    workerIds: { projectId: input.projectId },
    issues: [],
    skippedReason: 'worker_ref_link_only',
  };
  return { ok: true, result, humanLines: collectShareHumanLines(result) };
}

/** Local session: upload active zip, then return canonical share links. */
export async function shareLocalProjectUpload(input: {
  workerBaseUrl: string;
  zipFile: File;
  configJson?: string;
}): Promise<WebShareProjectOutcome> {
  const workerBaseUrl = resolveShareWorkerBaseUrl(input.workerBaseUrl);
  const humanLines: string[] = [];
  const zipBytes = new Uint8Array(await input.zipFile.arrayBuffer());
  humanLines.push(
    `Prepared project snapshot: ${input.zipFile.name}, ${String(zipBytes.byteLength)} bytes (browser zip).`,
  );

  const form = new FormData();
  form.set(
    'archive',
    new Blob([zipBytesToArrayBuffer(zipBytes)], { type: 'application/zip' }),
    input.zipFile.name,
  );
  const cfg = input.configJson?.trim();
  if (cfg && cfg.length > 0) form.set('configJson', cfg);

  const { httpStatus, body } = await workerFetchJson(`${normalizeBaseUrl(workerBaseUrl)}/v1/projects`, {
    method: 'POST',
    body: form,
  });
  const envelope = parseWorkerShareEnvelope(body);
  const uploadIssue = shareRemoteIssueFromWorker({ httpStatus, envelope });
  if (uploadIssue) {
    return { ok: false, issues: [uploadIssue], humanLines };
  }
  const projectId = workerProjectIdFromEnvelope(envelope.data);
  if (!projectId) {
    return {
      ok: false,
      issues: [
        {
          severity: 'error',
          code: ISSUE_SHARE_REMOTE_ERROR,
          message: 'Upload succeeded but projectId was missing.',
        },
      ],
      humanLines,
    };
  }

  const links = {
    web: buildWebWorkspaceShareUrl(projectId),
    worker: `${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(projectId)}`,
  };
  humanLines.push('Uploaded to worker.');
  humanLines.push(`Web: ${links.web}`);
  humanLines.push(`Worker metadata: ${links.worker}`);
  humanLines.push('Hosted project snapshots expire after ~7 days without reads on the worker.');

  const result: ShareRunResult = {
    action: 'uploaded',
    kind: 'project',
    links,
    workerIds: { projectId },
    issues: [],
  };
  return { ok: true, result, humanLines };
}

export async function shareProjectFromSession(input: {
  session: WorkspaceSession;
  workerBaseUrl: string;
  configJson?: string;
}): Promise<WebShareProjectOutcome> {
  if (input.session.mode === 'remote') {
    return shareRemoteProjectLinkOnly({
      workerBaseUrl: input.session.workerBaseUrl,
      projectId: input.session.projectId,
    });
  }
  const zip = input.session.activeZipFile;
  if (!zip) {
    return {
      ok: false,
      issues: [
        {
          severity: 'error',
          code: ISSUE_SHARE_REMOTE_ERROR,
          message: 'No zip is attached to this session. Reopen the project from Home before sharing.',
        },
      ],
      humanLines: [],
    };
  }
  return shareLocalProjectUpload({
    workerBaseUrl: input.workerBaseUrl,
    zipFile: zip,
    configJson: input.configJson,
  });
}

export type OpenSharedProjectOutcome =
  | {
      ok: true;
      session: WorkspaceSession;
      metadata: unknown;
    }
  | { ok: false; issue: Issue };

/** Hydrate a remote workspace from `GET /v1/projects/:id` (metadata probe before snapshot fetch). */
export async function openSharedWorkerProject(input: {
  workerBaseUrl: string;
  projectId: string;
}): Promise<OpenSharedProjectOutcome> {
  const workerBaseUrl = resolveShareWorkerBaseUrl(input.workerBaseUrl);
  const meta = await fetchWorkerProjectMetadata(workerBaseUrl, input.projectId);
  if (!meta.ok) return { ok: false, issue: meta.issue };

  const data = meta.data as {
    projectId?: string;
    preparedAt?: string;
    uploadedAt?: string;
    extraction?: { computedAt?: string };
  } | null;

  return {
    ok: true,
    metadata: meta.data,
    session: {
      mode: 'remote',
      workerBaseUrl,
      projectId: data?.projectId ?? input.projectId,
      label: `Shared project ${input.projectId}`,
      uploadMeta: {
        preparedAt: data?.preparedAt ?? data?.uploadedAt,
        extractionComputedAt: data?.extraction?.computedAt,
      },
    },
  };
}
