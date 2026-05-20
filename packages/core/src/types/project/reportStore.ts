/** Summary fields extracted from a stored report document (metadata GET). */
export type StoredReportSummary = {
  missingKeysCount: number;
  dynamicSitesCount: number;
  keyObservationsCount: number;
  ok: boolean;
};

/** Project paths surfaced on `GET /v1/reports/:id` (no full document). */
export type StoredReportProjectMeta = {
  sourceLocalePath: string;
  localesDir: string;
  srcRoot: string;
  sourceLocaleTag?: string;
};

/** Worker `GET /v1/reports/:id` payload (metadata only). */
export type StoredReportMetadata = {
  reportId: string;
  payloadContentHash: string;
  byteSize: number;
  storedAt: string;
  lastAccessedAt: string;
  schemaVersion: number;
  toolVersion: string;
  generatedAt: string;
  summary: StoredReportSummary;
  project: StoredReportProjectMeta;
};

/** Durable Object row for a cached shared report (`report:{id}` keys). */
export type ReportStoreRow = {
  reportId: string;
  payloadContentHash: string;
  byteSize: number;
  storedAt: string;
  lastAccessedAt?: string;
  document: Record<string, unknown>;
};
