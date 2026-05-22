import {
  buildProjectUploadSnapshotMeta,
  type Issue,
  type ProjectSnapshot,
  type ProjectStoreRow,
} from '@i18nprune/core';
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

export async function persistProjectSnapshot(
  stub: DurableObjectStub,
  snapshot: ProjectSnapshot,
): Promise<{ projectId: string; snapshotMeta: ReturnType<typeof buildProjectUploadSnapshotMeta> }> {
  const storedAt = new Date().toISOString();
  snapshot.storedAt = storedAt;
  const row: ProjectStoreRow = {
    projectId: snapshot.projectId,
    projectHash: snapshot.projectHash,
    snapshot,
  };
  await stub.fetch('https://do/project', { method: 'PUT', body: JSON.stringify(row) });
  return { projectId: snapshot.projectId, snapshotMeta: buildProjectUploadSnapshotMeta(snapshot) };
}
