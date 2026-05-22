import type { ReportEnvironmentSnapshot } from '../types/report/reportDocument.js';
import type {
  HostedIngestProcessorContext,
  HostPrepareCacheMeta,
  IngestRouteKind,
  MetadataScalar,
  PayloadProcessorEnvironment,
  PayloadProcessorInfo,
  ProjectExtractionCacheMeta,
  ProjectExtractionSummaryMeta,
  ProjectMetadataPrepareTiming,
  ProjectMetadataTiming,
  ProjectStoredMetadata,
} from '../types/project/metadata.js';
import { METADATA_DASH } from '../types/project/metadata.js';
import type { ProjectPrepareMeta } from '../types/project/prepare.js';
import type { ProjectStoreRow } from '../types/project/store.js';
import type { ProjectSnapshot } from '../types/project/upload.js';
import { resolveProcessorPresentation } from './processorPresets.js';

const IDLE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function finiteMs(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value);
}

function preferPositiveMs(measured: unknown, isoFallback: MetadataScalar): MetadataScalar {
  const m = finiteMs(measured);
  if (m !== undefined && m > 0) return m;
  const iso = finiteMs(isoFallback);
  if (iso !== undefined && iso > 0) return iso;
  return msOrDash(measured);
}

/**
 * Locale codes for worker metadata (`localeTags`).
 * Uses values persisted at prepare time, else keys of `localeJsonByTag`, else `[]`.
 */
export function resolveProjectLocaleTags(snapshot: ProjectSnapshot): string[] {
  const persisted = snapshot.localeTags?.filter((t) => typeof t === 'string' && t.length > 0) ?? [];
  if (persisted.length > 0) {
    return [...new Set(persisted)].sort((a, b) => a.localeCompare(b));
  }
  const fromMap = Object.keys(snapshot.localeJsonByTag ?? {});
  if (fromMap.length > 0) {
    return fromMap.sort((a, b) => a.localeCompare(b));
  }
  return [];
}

export function isoOrDash(value: unknown): MetadataScalar {
  if (typeof value !== 'string' || value.trim().length === 0) return METADATA_DASH;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return METADATA_DASH;
  return value;
}

export function msOrDash(value: unknown): MetadataScalar {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return METADATA_DASH;
  return Math.round(value);
}

export function isoMsDelta(start: unknown, end: unknown): MetadataScalar {
  const s = isoOrDash(start);
  const e = isoOrDash(end);
  if (s === METADATA_DASH || e === METADATA_DASH) return METADATA_DASH;
  return msOrDash(Date.parse(e as string) - Date.parse(s as string));
}

function environmentDisplay(env: ReportEnvironmentSnapshot | undefined): PayloadProcessorEnvironment | null {
  if (!env) return null;
  return {
    platform: typeof env.platform === 'string' && env.platform.length > 0 ? env.platform : METADATA_DASH,
    arch: typeof env.arch === 'string' && env.arch.length > 0 ? env.arch : METADATA_DASH,
    nodeVersion: typeof env.nodeVersion === 'string' && env.nodeVersion.length > 0 ? env.nodeVersion : METADATA_DASH,
    osRelease: typeof env.osRelease === 'string' && env.osRelease.length > 0 ? env.osRelease : METADATA_DASH,
    ...(env.distro !== undefined ? { distro: env.distro.length > 0 ? env.distro : METADATA_DASH } : {}),
    ...(env.wslDistroName !== undefined
      ? { wslDistroName: env.wslDistroName.length > 0 ? env.wslDistroName : METADATA_DASH }
      : {}),
    runtimeFamily:
      typeof env.runtimeFamily === 'string' && env.runtimeFamily.length > 0 ? env.runtimeFamily : METADATA_DASH,
  };
}

export function buildExtractionCacheMeta(
  hostCache: HostPrepareCacheMeta | undefined,
  ingestRoute: IngestRouteKind,
): ProjectExtractionCacheMeta {
  if (hostCache) {
    return {
      analysis: hostCache.analysis,
      analysisReason: hostCache.analysisReason,
      timingsTrustworthy: hostCache.timingsTrustworthy,
      filesEpoch: hostCache.filesEpoch,
      projectCacheEnabled: hostCache.projectCacheEnabled,
    };
  }
  if (ingestRoute === 'archive') {
    return {
      analysis: 'disabled',
      analysisReason: 'archive_ingest_no_project_cache',
      timingsTrustworthy: true,
      filesEpoch: METADATA_DASH,
      projectCacheEnabled: false,
    };
  }
  return {
    analysis: METADATA_DASH,
    analysisReason: METADATA_DASH,
    timingsTrustworthy: false,
    filesEpoch: METADATA_DASH,
    projectCacheEnabled: false,
  };
}

export function buildPayloadProcessorInfo(input: {
  ingestRoute: IngestRouteKind;
  prepareMeta?: ProjectPrepareMeta;
  processorContext?: HostedIngestProcessorContext;
}): PayloadProcessorInfo {
  const presentation = resolveProcessorPresentation({
    ingestRoute: input.ingestRoute,
    prepareHost: input.prepareMeta?.prepareHost,
    processorContext: input.processorContext,
  });
  return {
    ...presentation,
    environment: environmentDisplay(input.processorContext?.environment),
  };
}

export function buildProjectMetadataPrepareTiming(
  prepareMeta?: ProjectPrepareMeta,
  snapshot?: ProjectSnapshot,
): ProjectMetadataPrepareTiming {
  if (!snapshot) {
    return {
      zipParsedMs: msOrDash(prepareMeta?.zipParsedMs),
      analysisMs: msOrDash(prepareMeta?.analysisMs),
      extractionMs: msOrDash(prepareMeta?.extractionMs),
      totalMs: msOrDash(prepareMeta?.totalMs),
    };
  }
  const zipIso = isoMsDelta(snapshot.requestReceivedAt ?? snapshot.uploadedAt, snapshot.uploadedAt);
  const extractIso = isoMsDelta(
    snapshot.extraction?.extractionStartedAt ?? snapshot.uploadedAt,
    snapshot.extraction?.computedAt,
  );
  const totalIso = isoMsDelta(snapshot.requestReceivedAt ?? snapshot.uploadedAt, snapshot.extraction?.computedAt);

  const zipParsedMs = preferPositiveMs(prepareMeta?.zipParsedMs, zipIso);
  const extractionMs = preferPositiveMs(prepareMeta?.extractionMs, extractIso);
  let totalMs = preferPositiveMs(prepareMeta?.totalMs, totalIso);

  if (
    typeof totalMs === 'number' &&
    totalMs > 0 &&
    (extractionMs === 0 || extractionMs === METADATA_DASH) &&
    typeof zipParsedMs === 'number'
  ) {
    return {
      zipParsedMs,
      analysisMs: msOrDash(prepareMeta?.analysisMs),
      extractionMs: Math.max(0, totalMs - zipParsedMs),
      totalMs,
    };
  }

  return {
    zipParsedMs,
    analysisMs: msOrDash(prepareMeta?.analysisMs),
    extractionMs,
    totalMs,
  };
}

export function buildProjectMetadataTiming(input: {
  snapshot: ProjectSnapshot;
  prepareMeta?: ProjectPrepareMeta;
  lastAccessedAt?: string;
}): ProjectMetadataTiming {
  const snap = input.snapshot;
  const extraction = snap.extraction;
  const requestReceivedAt = isoOrDash(snap.requestReceivedAt ?? snap.uploadedAt);
  const uploadedAt = isoOrDash(snap.uploadedAt);
  const extractionStartedAt = isoOrDash(extraction?.extractionStartedAt ?? snap.uploadedAt);
  const extractionComputedAt = isoOrDash(extraction?.computedAt);
  const storedAt = isoOrDash(snap.storedAt ?? extraction?.computedAt);

  const extractionDuration = preferPositiveMs(
    input.prepareMeta?.extractionMs,
    isoMsDelta(extraction?.extractionStartedAt ?? snap.uploadedAt, extraction?.computedAt),
  );

  return {
    requestReceivedAt,
    uploadedAt,
    storedAt,
    lastAccessedAt: isoOrDash(input.lastAccessedAt ?? snap.storedAt),
    prepare: buildProjectMetadataPrepareTiming(input.prepareMeta, snap),
    extraction: {
      startedAt: extractionStartedAt,
      computedAt: extractionComputedAt,
      durationMs: extractionDuration,
    },
    edge: {
      persistMs: preferPositiveMs(
        input.prepareMeta?.persistMs,
        isoMsDelta(extraction?.computedAt, snap.storedAt),
      ),
    },
  };
}

function expiresAtFromLastAccess(lastAccessedAt: string | undefined, storedAt: string | undefined): MetadataScalar {
  const base = isoOrDash(lastAccessedAt ?? storedAt);
  if (base === METADATA_DASH) return METADATA_DASH;
  return new Date(Date.parse(base as string) + IDLE_RETENTION_MS).toISOString();
}

export function buildProjectExtractionSummary(
  snapshot: ProjectSnapshot,
  cache: ProjectExtractionCacheMeta,
): ProjectExtractionSummaryMeta | null {
  const extraction = snapshot.extraction;
  if (!extraction) return null;
  return {
    configHash: extraction.configHash.length > 0 ? extraction.configHash : METADATA_DASH,
    sourceLocalePath: extraction.sourceLocalePath.length > 0 ? extraction.sourceLocalePath : METADATA_DASH,
    srcRoot: extraction.srcRoot.length > 0 ? extraction.srcRoot : METADATA_DASH,
    localesDir: extraction.localesDir.length > 0 ? extraction.localesDir : METADATA_DASH,
    keyObservationsCount: extraction.keyObservationsCount,
    dynamicSitesCount: extraction.dynamicSitesCount,
    cache,
  };
}

/** Build metadata for `GET /v1/projects/:id` from a stored row. */
export function buildProjectStoredMetadata(row: ProjectStoreRow): ProjectStoredMetadata {
  const ingestRoute = row.ingestRoute ?? 'prepared';
  const lastAccessedAt = row.lastAccessedAt ?? row.snapshot.storedAt ?? row.snapshot.uploadedAt;
  return {
    projectId: row.projectId,
    projectHash: row.projectHash,
    uploadedAt: isoOrDash(row.snapshot.uploadedAt),
    zipBytes: row.snapshot.zipBytes,
    fileCount: row.snapshot.fileCount,
    textFileCount: row.snapshot.textFileCount,
    detectedConfigPath: row.snapshot.detectedConfigPath,
    localeTags: resolveProjectLocaleTags(row.snapshot),
    expiresAt: expiresAtFromLastAccess(row.lastAccessedAt, row.snapshot.storedAt),
    timing: buildProjectMetadataTiming({
      snapshot: row.snapshot,
      prepareMeta: row.prepareMeta,
      lastAccessedAt,
    }),
    processor: buildPayloadProcessorInfo({
      ingestRoute,
      prepareMeta: row.prepareMeta,
      processorContext: row.processorContext,
    }),
    extraction: buildProjectExtractionSummary(
      row.snapshot,
      buildExtractionCacheMeta(row.prepareMeta?.hostCache, ingestRoute),
    ),
  };
}
