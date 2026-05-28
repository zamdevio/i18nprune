import type { HostedIngestProcessorContext } from '../metadata.js';
import type { IngestRouteKind } from '../metadata.js';
import type { PrepareHostKind, ProjectPrepareMeta } from '../prepare/index.js';
import type { PayloadProcessorInfo, ReportMetadataDocumentTiming } from '../metadata.js';
import type { MetadataScalar } from '../metadata.js';
import type { ProjectExtractionCacheMeta } from '../metadata.js';

/** Summary fields extracted from a stored report document (metadata GET). */
export type StoredReportSummary = {
  missingKeysCount: number;
  dynamicSitesCount: number;
  keyObservationsCount: number;
  ok: boolean;
};

/** Project paths surfaced on `GET /v1/reports/:id` (no full document). */
export type StoredReportProjectMeta = {
  sourceLocalePath: MetadataScalar;
  localesDir: MetadataScalar;
  srcRoot: MetadataScalar;
  sourceLocaleTag?: string;
};

export type StoredReportArtifactMeta = {
  kind: 'report';
  id: string;
  contentHash: string;
  byteSize: number;
  formatVersion: number;
  toolVersion: MetadataScalar;
};

export type StoredReportExecutionMeta = {
  surface: MetadataScalar;
  host: MetadataScalar;
  route: MetadataScalar;
  transport: 'https-json';
  computeLocation: 'edge';
};

export type StoredReportAnalysisMeta = {
  sourceLocalePath: MetadataScalar;
  localesDir: MetadataScalar;
  srcRoot: MetadataScalar;
  missingKeysCount: number;
  dynamicSitesCount: number;
  keyObservationsCount: number;
  ok: boolean;
};

export type StoredReportStorageMeta = {
  backend: 'durable-object';
  dedupByContentHash: true;
  contentAddressed: true;
};

export type StoredReportRetentionMeta = {
  policy: 'idle-7d';
  expiresAt: MetadataScalar;
  lastAccessedAt: MetadataScalar;
};

export type StoredReportCapabilitiesMeta = {
  preparedUploads: true;
  archiveUploads: true;
  readOperations: readonly ['metadata', 'document'];
  project: false;
  report: true;
};

/** Worker `GET /v1/reports/:id` payload (metadata only). */
export type StoredReportMetadata = {
  /** Metadata envelope contract version. */
  schemaVersion: 1;
  /** Underlying hosted artifact format version. */
  formatVersion: 1;

  // 1) Identity / artifact
  artifact: StoredReportArtifactMeta;

  // 2) Lifecycle / timestamps
  timing: ReportMetadataDocumentTiming;

  // 3) Processor / provenance
  processor: PayloadProcessorInfo;
  summary: StoredReportSummary;

  // 4) Execution / transport
  execution: StoredReportExecutionMeta;

  // 5) Analysis / extraction
  analysis: StoredReportAnalysisMeta;

  // 6) Cache / trust
  cache: ProjectExtractionCacheMeta;

  // 7) Storage
  storage: StoredReportStorageMeta;

  // 8) Retention
  retention: StoredReportRetentionMeta;

  // 9) Capabilities
  capabilities: StoredReportCapabilitiesMeta;
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
