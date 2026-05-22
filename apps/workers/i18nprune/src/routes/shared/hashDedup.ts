import {
  buildProjectUploadSnapshotMeta,
  buildStoredReportMetadata,
  workerHashAlreadyExistsWarning,
  type ProjectStoreRow,
  type ReportStoreRow,
  type WorkerApiWarningItem,
} from '@i18nprune/core';

/** Lookup by content hash only (does not bump `lastAccessedAt`). */
export async function lookupProjectIdByContentHash(
  stub: DurableObjectStub,
  projectHash: string,
): Promise<string | null> {
  const resp = await stub.fetch(`https://do/projecthash/${encodeURIComponent(projectHash)}`);
  const body = (await resp.json()) as { projectId: string | null };
  return body.projectId;
}

export async function loadProjectRow(stub: DurableObjectStub, projectId: string): Promise<ProjectStoreRow | null> {
  const resp = await stub.fetch(`https://do/project/${encodeURIComponent(projectId)}`);
  const body = (await resp.json()) as { project: ProjectStoreRow | null };
  return body.project;
}

export async function lookupReportIdByPayloadHash(
  stub: DurableObjectStub,
  payloadContentHash: string,
): Promise<string | null> {
  const resp = await stub.fetch(`https://do/reporthash/${encodeURIComponent(payloadContentHash)}`);
  const body = (await resp.json()) as { reportId: string | null };
  return body.reportId;
}

export async function loadReportRow(stub: DurableObjectStub, reportId: string): Promise<ReportStoreRow | null> {
  const resp = await stub.fetch(`https://do/report/${encodeURIComponent(reportId)}`);
  const body = (await resp.json()) as { report: ReportStoreRow | null };
  return body.report;
}

export function projectDedupUploadPayload(row: ProjectStoreRow): {
  projectId: string;
  snapshotMeta: ReturnType<typeof buildProjectUploadSnapshotMeta>;
  deduped: true;
} {
  return {
    projectId: row.projectId,
    snapshotMeta: buildProjectUploadSnapshotMeta(row),
    deduped: true,
  };
}

export function reportUploadSuccessPayload(row: ReportStoreRow): {
  reportId: string;
  payloadContentHash: string;
  byteSize: number;
  storedAt: string;
  expiresAt: ReturnType<typeof buildStoredReportMetadata>['expiresAt'];
} {
  const meta = buildStoredReportMetadata(row);
  return {
    reportId: row.reportId,
    payloadContentHash: row.payloadContentHash,
    byteSize: row.byteSize,
    storedAt: row.storedAt,
    expiresAt: meta.expiresAt,
  };
}

export function reportDedupUploadPayload(row: ReportStoreRow): ReturnType<typeof reportUploadSuccessPayload> & {
  deduped: true;
} {
  return { ...reportUploadSuccessPayload(row), deduped: true };
}

export function hashDedupWarnings(kind: 'project' | 'report', existingId: string): WorkerApiWarningItem[] {
  return [workerHashAlreadyExistsWarning(kind, existingId)];
}

/**
 * Force re-upload: same content hash, new row id. Purges any prior `projecthash` + `project` rows
 * for this hash (idempotent — missing keys never throw).
 */
export async function replaceHostedProjectForForce(
  stub: DurableObjectStub,
  projectHash: string,
): Promise<void> {
  await stub.fetch(`https://do/projecthash/${encodeURIComponent(projectHash)}`, { method: 'DELETE' });
}

export async function replaceHostedReportForForce(
  stub: DurableObjectStub,
  payloadContentHash: string,
): Promise<void> {
  await stub.fetch(`https://do/reporthash/${encodeURIComponent(payloadContentHash)}`, { method: 'DELETE' });
}
