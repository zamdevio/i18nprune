import type { CacheDispatchReason, CacheDispatchStatus } from '../cache/index.js';
import type { ReportEnvironmentSnapshot } from '../report/reportDocument.js';

/** Display placeholder when a timestamp or metric is missing or invalid. */
export const METADATA_DASH = '—' as const;

export type MetadataDash = typeof METADATA_DASH;

export type MetadataScalar = string | number | MetadataDash;

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
  requestReceivedAt: MetadataScalar;
  uploadedAt: MetadataScalar;
  storedAt: MetadataScalar;
  lastAccessedAt: MetadataScalar;
  prepare: ProjectMetadataPrepareTiming;
  extraction: ProjectMetadataExtractionTiming;
  edge: ProjectMetadataEdgeTiming;
};

export type ProjectExtractionCacheMeta = {
  analysis: CacheDispatchStatus | 'unavailable' | MetadataDash;
  analysisReason: MetadataScalar;
  timingsTrustworthy: boolean;
  filesEpoch: MetadataScalar;
  projectCacheEnabled: boolean;
};

export type ProjectExtractionSummaryMeta = {
  configHash: MetadataScalar;
  sourceLocalePath: MetadataScalar;
  srcRoot: MetadataScalar;
  localesDir: MetadataScalar;
  keyObservationsCount: number;
  dynamicSitesCount: number;
  cache: ProjectExtractionCacheMeta;
};

export type ReportMetadataDocumentTiming = {
  requestReceivedAt?: MetadataScalar;
  generatedAt: MetadataScalar;
  storedAt: MetadataScalar;
  lastAccessedAt: MetadataScalar;
  prepare?: ProjectMetadataPrepareTiming;
  edge: ProjectMetadataEdgeTiming;
};

export type ProjectStoredMetadata = {
  projectId: string;
  projectHash: string;
  uploadedAt: MetadataScalar;
  zipBytes: number;
  fileCount: number;
  textFileCount: number;
  detectedConfigPath: string | null;
  localeTags: string[];
  expiresAt: MetadataScalar;
  timing: ProjectMetadataTiming;
  processor: PayloadProcessorInfo;
  extraction: ProjectExtractionSummaryMeta | null;
};

/** Re-export for consumers documenting cache reasons on metadata. */
export type { CacheDispatchReason, CacheDispatchStatus };
