import {
  buildProjectUploadSnapshotMeta,
  SDK_VERSION,
  workerErrorFromCode,
  workerErrorFromIssue,
  type HostedIngestProcessorContext,
  type IngestRouteKind,
  type Issue,
  type ProjectPrepareMeta,
  type ProjectSnapshot,
  type ProjectStoreRow,
} from '@i18nprune/core';
import type { ReportEnvironmentSnapshot } from '@i18nprune/core';
import type { Context } from 'hono';
import { ApiResponse } from '../../response';
import { readDoStorageFailure, storageLimitResponseFromDo } from './doResponse.js';
import type { WorkerEnv } from '../types';

export function errorResponseFromIssues(c: Context<WorkerEnv>, issues: Issue[]) {
  const first = issues[0];
  if (!first) {
    return ApiResponse.structuredError(c, workerErrorFromCode('INGEST_INVALID', 'Invalid ingest body'));
  }
  return ApiResponse.structuredError(c, workerErrorFromIssue(first));
}

export function workerErrorResponse(c: Context<WorkerEnv>, code: string, message: string) {
  return ApiResponse.structuredError(c, workerErrorFromCode(code, message));
}

/** Edge runtime label for archive uploads prepared on the worker. */
export function workerArchiveProcessorContext(): HostedIngestProcessorContext {
  return {
    surface: 'worker',
    route: 'archive',
    sdk: 'i18nprune-worker',
    sdkVersion: SDK_VERSION,
    toolVersion: 'i18nprune-worker',
    environment: {
      platform: 'cloudflare-workers',
      arch: 'edge',
      nodeVersion: 'workers',
      osRelease: 'edge',
      runtimeFamily: 'linux',
    } satisfies ReportEnvironmentSnapshot,
  };
}

export async function persistProjectSnapshot(
  stub: DurableObjectStub,
  input: {
    snapshot: ProjectSnapshot;
    ingestRoute: IngestRouteKind;
    prepareMeta?: ProjectPrepareMeta;
    processorContext?: HostedIngestProcessorContext;
  },
): Promise<{ projectId: string; snapshotMeta: ReturnType<typeof buildProjectUploadSnapshotMeta> }> {
  const persistWall0 = Date.now();
  const resp = await stub.fetch('https://do/project', {
    method: 'PUT',
    body: JSON.stringify({
      projectId: input.snapshot.projectId,
      projectHash: input.snapshot.projectHash,
      snapshot: input.snapshot,
      ingestRoute: input.ingestRoute,
      prepareMeta: input.prepareMeta,
      processorContext: input.processorContext,
    } satisfies ProjectStoreRow),
  });
  const storageFailure = await readDoStorageFailure(resp);
  if (storageFailure) {
    throw storageFailure;
  }
  if (!resp.ok) {
    throw new Error(`Project persist failed (HTTP ${String(resp.status)})`);
  }

  const persistMs = Math.max(0, Date.now() - persistWall0);
  const storedAt = new Date().toISOString();
  input.snapshot.storedAt = storedAt;
  const row: ProjectStoreRow = {
    projectId: input.snapshot.projectId,
    projectHash: input.snapshot.projectHash,
    snapshot: input.snapshot,
    ingestRoute: input.ingestRoute,
    prepareMeta: { ...input.prepareMeta, persistMs },
    processorContext: input.processorContext,
  };
  const finalizeResp = await stub.fetch('https://do/project', { method: 'PUT', body: JSON.stringify(row) });
  const finalizeFailure = await readDoStorageFailure(finalizeResp);
  if (finalizeFailure) {
    throw finalizeFailure;
  }
  if (!finalizeResp.ok) {
    throw new Error(`Project persist finalize failed (HTTP ${String(finalizeResp.status)})`);
  }

  return { projectId: input.snapshot.projectId, snapshotMeta: buildProjectUploadSnapshotMeta(row) };
}

export function storageLimitResponseFromPersistError(
  c: Context<WorkerEnv>,
  err: unknown,
): Response | null {
  if (!err || typeof err !== 'object' || !('code' in err)) return null;
  const body = err as { code?: string; message?: string; evictionAttempted?: boolean };
  if (body.code !== 'STORAGE_QUOTA_EXCEEDED') return null;
  return storageLimitResponseFromDo(c, body);
}
