import {
  buildProjectUploadSnapshotMeta,
  SDK_VERSION,
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
import type { WorkerEnv } from '../types';

export function workerCodeFromIssue(issue: Issue): string {
  const tail = issue.code.replace(/^i18nprune\.(project|report|share)\./, '').replace(/\./g, '_');
  return tail.length > 0 ? tail.toUpperCase() : 'INGEST_INVALID';
}

export function badRequestFromIssues(c: Context<WorkerEnv>, issues: Issue[]) {
  const first = issues[0];
  return ApiResponse.badRequest(
    c,
    first ? workerCodeFromIssue(first) : 'INGEST_INVALID',
    first?.message ?? 'Invalid ingest body',
  );
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
  const storedAt = new Date().toISOString();
  input.snapshot.storedAt = storedAt;
  const row: ProjectStoreRow = {
    projectId: input.snapshot.projectId,
    projectHash: input.snapshot.projectHash,
    snapshot: input.snapshot,
    ingestRoute: input.ingestRoute,
    prepareMeta: input.prepareMeta,
    processorContext: input.processorContext,
  };
  await stub.fetch('https://do/project', { method: 'PUT', body: JSON.stringify(row) });
  return { projectId: input.snapshot.projectId, snapshotMeta: buildProjectUploadSnapshotMeta(row) };
}
