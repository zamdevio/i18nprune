import {
  emitShareUploadHumanMessages,
  ISSUE_SHARE_REMOTE_ERROR,
  resolveShareWorkerBaseUrl,
  type Issue,
  type WorkspaceWorkerShareBinding,
  type RunEmitter,
  type ShareRunResult,
  type WorkspaceSession,
} from '@i18nprune/core';
import { buildWebWorkspaceShareUrl } from '../../../hooks/useAppRoute.js';
import {
  localWorkspaceShareIsLinkOnly,
  workspaceShareConfigFingerprint,
} from '../../workspace/shareBinding.js';
import { uploadProjectToWorker } from './projectUpload';
import { fetchWorkerProjectMetadata } from './workerFetch';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
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

/** Local session: prepare in browser + upload prepared JSON, then return canonical share links. */
export async function shareLocalProjectUpload(input: {
  workerBaseUrl: string;
  zipFile: File;
  configJson?: string;
  force?: boolean;
}): Promise<WebShareProjectOutcome> {
  const workerBaseUrl = resolveShareWorkerBaseUrl(input.workerBaseUrl);
  const humanLines: string[] = [];
  const zipBytes = new Uint8Array(await input.zipFile.arrayBuffer());
  humanLines.push(
    `Prepared project snapshot: ${input.zipFile.name}, ${String(zipBytes.byteLength)} bytes (browser prepare → JSON ingest).`,
  );
  if (input.force) {
    humanLines.push(
      'Force ingest: worker replaces any prior row for this payload hash (used after config override re-upload).',
    );
  }

  const uploaded = await uploadProjectToWorker({
    workerBaseUrl,
    zipBytes,
    zipFileName: input.zipFile.name,
    configJson: input.configJson,
    ingestMode: 'prepared',
    force: input.force,
  });
  if (!uploaded.ok) {
    return { ok: false, issues: [uploaded.issue], humanLines };
  }

  const links = {
    web: buildWebWorkspaceShareUrl(uploaded.projectId),
    worker: `${normalizeBaseUrl(workerBaseUrl)}/v1/projects/${encodeURIComponent(uploaded.projectId)}`,
  };
  if (uploaded.deduped) {
    humanLines.push('Worker reused existing project (HASH_ALREADY_EXISTS — same prepared payload hash).');
  } else {
    humanLines.push('Uploaded to worker.');
  }
  humanLines.push(`Web: ${links.web}`);
  humanLines.push(`Worker metadata: ${links.worker}`);
  humanLines.push('Hosted project snapshots expire after ~7 days without reads on the worker.');

  const result: ShareRunResult = {
    action: uploaded.deduped ? 'skipped' : 'uploaded',
    kind: 'project',
    links,
    workerIds: { projectId: uploaded.projectId },
    issues: [],
    ...(uploaded.deduped ? { skippedReason: 'hash_unchanged' as const } : {}),
  };
  return { ok: true, result, humanLines };
}

export async function shareProjectFromSession(input: {
  session: WorkspaceSession;
  workerBaseUrl: string;
  configJson?: string;
  force?: boolean;
}): Promise<WebShareProjectOutcome> {
  if (input.session.mode === 'remote') {
    return shareRemoteProjectLinkOnly({
      workerBaseUrl: input.session.workerBaseUrl,
      projectId: input.session.projectId,
    });
  }

  if (localWorkspaceShareIsLinkOnly(input.session, input.workerBaseUrl, input.configJson)) {
    return shareRemoteProjectLinkOnly({
      workerBaseUrl: input.session.workerShare.workerBaseUrl,
      projectId: input.session.workerShare.projectId,
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
    force: input.force,
  });
}

export type BindLocalShareInput = {
  session: WorkspaceSession & { mode: 'local' };
  workerBaseUrl: string;
  projectId: string;
  configJson?: string;
};

export function bindLocalShareToSession(input: BindLocalShareInput): WorkspaceSession {
  const binding: WorkspaceWorkerShareBinding = {
    workerBaseUrl: resolveShareWorkerBaseUrl(input.workerBaseUrl),
    projectId: input.projectId,
    configFingerprint: workspaceShareConfigFingerprint(input.configJson),
  };
  return {
    ...input.session,
    workerShare: binding,
  };
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
