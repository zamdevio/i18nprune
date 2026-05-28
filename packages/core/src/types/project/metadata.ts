import type { CacheDispatchReason, CacheDispatchStatus } from '../cache/index.js';
import type { ReportEnvironmentSnapshot } from '../report/reportDocument.js';

/** Display placeholder (presentation-only, never serialized in transport). */
export const METADATA_DASH = '—' as const;

/** Machine-facing scalar for transport payloads. */
export type MetadataScalar = string | number | null;

/** Built-in ingest routes; hosts/SDKs may send other route ids via `processorContext.route`. */
export type KnownIngestRouteKind = 'prepared' | 'archive';

/** `prepared` | `archive` | `custom` | any SDK-specific route id (e.g. `ci-upload`). */
export type IngestRouteKind = KnownIngestRouteKind | 'custom' | (string & {});

/** Built-in prepare surfaces; SDKs may set `processorContext.surface` to any stable id. */
export type KnownPayloadProcessorSurface = 'cli' | 'web' | 'worker';

/** `cli` | `web` | `worker` | `custom` | any SDK label (e.g. `github-action`, `acme-ci`). */
export type PayloadProcessorSurface = KnownPayloadProcessorSurface | 'custom' | (string & {});

export type PayloadProcessorEnvironment = {
  platform: MetadataScalar;
  arch: MetadataScalar;
  nodeVersion: MetadataScalar;
  osRelease: MetadataScalar;
  distro?: MetadataScalar;
  wslDistroName?: MetadataScalar;
  runtimeFamily: MetadataScalar;
};

/**
 * Analysis/files cache state at prepare time (host only).
 * Helps interpret sub-second `timing.prepare` when analysis was served from cache.
 */
export type HostPrepareCacheMeta = {
  analysis: CacheDispatchStatus | 'unavailable';
  analysisReason: MetadataScalar;
  /** False when analysis cache hit and prepare ms are not a full rescan (trust extraction counts, not prepare ms). */
  timingsTrustworthy: boolean;
  filesEpoch: MetadataScalar;
  projectCacheEnabled: boolean;
};

/** Stable `processor` block on GET metadata — same keys for every surface. */
export type PayloadProcessorInfo = {
  surface: PayloadProcessorSurface;
  surfaceLabel: MetadataScalar;
  route: IngestRouteKind;
  routeLabel: MetadataScalar;
  prepareHost: MetadataScalar;
  toolVersion: MetadataScalar;
  sdk: MetadataScalar;
  /** Semver of `@i18nprune/core` used to prepare the payload. */
  sdkVersion: MetadataScalar;
  prepareSummary: MetadataScalar;
  environment: PayloadProcessorEnvironment | null;
};

/** Optional host context on JSON ingest (CLI / web / custom SDK). */
export type HostedIngestProcessorContext = {
  /** Surface id; built-ins: cli | web | worker | custom — any string allowed for SDK hosts. */
  surface?: string;
  /** Display name override (e.g. "Acme CI", "GitHub Action"). */
  surfaceLabel?: string;
  /** Route id; built-ins: prepared | archive | custom. */
  route?: string;
  routeLabel?: string;
  prepareSummary?: string;
  /** SDK package or integration name when not i18nprune CLI/web. */
  sdk?: string;
  /** Semver of `@i18nprune/core` (SDK) used at prepare time. */
  sdkVersion?: string;
  toolVersion?: string;
  environment?: ReportEnvironmentSnapshot;
};

export type ProjectMetadataPrepareTiming = {
  zipParsedMs: MetadataScalar;
  analysisMs: MetadataScalar;
  extractionMs: MetadataScalar;
  totalMs: MetadataScalar;
};

export type ProjectMetadataExtractionTiming = {
  startedAt: MetadataScalar;
  computedAt: MetadataScalar;
  durationMs: MetadataScalar;
};

export type ProjectMetadataEdgeTiming = {
  persistMs: MetadataScalar;
};

/** Ordered timing block for `GET /v1/projects/:id` and upload meta. */
export type ProjectMetadataTiming = {
  /** Payload ready to persist (host prepare on prepared route; worker zip parse end on archive). */
  preparedAt: MetadataScalar;
  requestReceivedAt: MetadataScalar;
  storedAt: MetadataScalar;
  lastAccessedAt: MetadataScalar;
  prepare: ProjectMetadataPrepareTiming;
  extraction: ProjectMetadataExtractionTiming;
  edge: ProjectMetadataEdgeTiming;
};

export type ProjectExtractionCacheMeta = {
  available: boolean;
  analysis: CacheAnalysisState;
  analysisReason: MetadataScalar;
  timingsTrustworthy: boolean;
  filesEpoch: MetadataScalar;
  projectCacheEnabled: boolean;
};

export type CacheAnalysisState = 'hit' | 'miss' | 'disabled' | 'unavailable' | 'bypassed' | null;

export type ProjectExtractionSummaryMeta = {
  configHash: MetadataScalar;
  sourceLocalePath: MetadataScalar;
  srcRoot: MetadataScalar;
  localesDir: MetadataScalar;
  keyObservationsCount: number;
  dynamicSitesCount: number;
  cache: ProjectExtractionCacheMeta;
};

export type ProjectStoredSummary = {
  localeCount: number;
  missingKeysCount: number | null;
  ok: boolean | null;
};

export type ProjectStoredArtifactMeta = {
  kind: 'project';
  id: string;
  contentHash: string;
  byteSize: number;
  fileCount: number;
  textFileCount: number;
  detectedConfigPath: string | null;
  localeTags: string[];
};

export type ProjectStoredExecutionMeta = {
  surface: MetadataScalar;
  host: MetadataScalar;
  route: MetadataScalar;
  transport: 'https-json';
  computeLocation: 'edge';
};

export type ProjectStoredAnalysisMeta = {
  localeTags: string[];
  detectedConfigPath: string | null;
  configHash: MetadataScalar;
  sourceLocalePath: MetadataScalar;
  srcRoot: MetadataScalar;
  localesDir: MetadataScalar;
  keyObservationsCount: number;
  dynamicSitesCount: number;
};

export type ProjectStoredStorageMeta = {
  backend: 'durable-object';
  dedupByContentHash: true;
  contentAddressed: true;
};

export type ProjectStoredRetentionMeta = {
  policy: 'idle-7d';
  expiresAt: MetadataScalar;
  lastAccessedAt: MetadataScalar;
};

export type ProjectStoredCapabilitiesMeta = {
  preparedUploads: true;
  archiveUploads: true;
  readOperations: readonly ['metadata', 'snapshot', 'tree', 'validate', 'review', 'missing', 'locales', 'doctor', 'report'];
  project: true;
  report: false;
};

export type ReportMetadataDocumentTiming = {
  requestReceivedAt?: MetadataScalar;
  preparedAt: MetadataScalar;
  storedAt: MetadataScalar;
  lastAccessedAt: MetadataScalar;
  prepare?: ProjectMetadataPrepareTiming;
  edge: ProjectMetadataEdgeTiming;
};

export type ProjectStoredMetadata = {
  /** Metadata envelope contract version. */
  schemaVersion: 1;
  /** Underlying hosted artifact format version. */
  formatVersion: 1;

  // 1) Identity / artifact
  artifact: ProjectStoredArtifactMeta;
  // 2) Lifecycle / timestamps
  timing: ProjectMetadataTiming;

  // 3) Processor / provenance
  processor: PayloadProcessorInfo;
  // 4) Execution / transport
  execution: ProjectStoredExecutionMeta;

  // 5) Analysis / extraction
  analysis: ProjectStoredAnalysisMeta | null;
  summary: ProjectStoredSummary;

  // 6) Cache / trust
  cache: ProjectExtractionCacheMeta;

  // 7) Storage
  storage: ProjectStoredStorageMeta;

  // 8) Retention
  retention: ProjectStoredRetentionMeta;

  // 9) Capabilities
  capabilities: ProjectStoredCapabilitiesMeta;
};

/** Re-export for consumers documenting cache reasons on metadata. */
export type { CacheDispatchReason, CacheDispatchStatus };
