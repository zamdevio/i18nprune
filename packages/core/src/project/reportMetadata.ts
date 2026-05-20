import type { ReportStoreRow, StoredReportMetadata, StoredReportProjectMeta, StoredReportSummary } from '../types/project/reportStore.js';

function readSummary(document: Record<string, unknown>): StoredReportSummary {
  const raw = document.summary;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { missingKeysCount: 0, dynamicSitesCount: 0, keyObservationsCount: 0, ok: false };
  }
  const s = raw as Record<string, unknown>;
  return {
    missingKeysCount: typeof s.missingKeysCount === 'number' ? s.missingKeysCount : 0,
    dynamicSitesCount: typeof s.dynamicSitesCount === 'number' ? s.dynamicSitesCount : 0,
    keyObservationsCount: typeof s.keyObservationsCount === 'number' ? s.keyObservationsCount : 0,
    ok: s.ok === true,
  };
}

function readProject(document: Record<string, unknown>): StoredReportProjectMeta {
  const raw = document.project;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { sourceLocalePath: '-', localesDir: '-', srcRoot: '-' };
  }
  const p = raw as Record<string, unknown>;
  const sourceLocalePath = typeof p.sourceLocalePath === 'string' ? p.sourceLocalePath : '-';
  const localesDir = typeof p.localesDir === 'string' ? p.localesDir : '-';
  const srcRoot = typeof p.srcRoot === 'string' ? p.srcRoot : '-';
  const sourceLocaleTag = typeof p.sourceLocaleTag === 'string' ? p.sourceLocaleTag : undefined;
  return { sourceLocalePath, localesDir, srcRoot, sourceLocaleTag };
}

/** Build metadata for `GET /v1/reports/:id` from a stored row (omits full document). */
export function buildStoredReportMetadata(row: ReportStoreRow): StoredReportMetadata {
  const lastAccessedAt = row.lastAccessedAt ?? row.storedAt;
  return {
    reportId: row.reportId,
    payloadContentHash: row.payloadContentHash,
    byteSize: row.byteSize,
    storedAt: row.storedAt,
    lastAccessedAt,
    schemaVersion: typeof row.document.schemaVersion === 'number' ? row.document.schemaVersion : 0,
    toolVersion: typeof row.document.toolVersion === 'string' ? row.document.toolVersion : 'unknown',
    generatedAt: typeof row.document.generatedAt === 'string' ? row.document.generatedAt : row.storedAt,
    summary: readSummary(row.document),
    project: readProject(row.document),
  };
}
