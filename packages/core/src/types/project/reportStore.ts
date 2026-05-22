import type { HostedIngestProcessorContext } from './metadata.js';
import type { IngestRouteKind } from './metadata.js';
import type { PrepareHostKind } from './prepareHost.js';
import type { PayloadProcessorInfo, ReportMetadataDocumentTiming } from './metadata.js';
import type { ProjectPrepareMeta } from './prepare.js';
import type { MetadataScalar } from './metadata.js';

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
  expiresAt: MetadataScalar;
  timing: ReportMetadataDocumentTiming;
  processor: PayloadProcessorInfo;
  schemaVersion: number;
  toolVersion: string;
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
  ingestRoute: IngestRouteKind;
  prepareHost?: PrepareHostKind;
  prepareMeta?: ProjectPrepareMeta;
  requestReceivedAt?: string;
  processorContext?: HostedIngestProcessorContext;
};
