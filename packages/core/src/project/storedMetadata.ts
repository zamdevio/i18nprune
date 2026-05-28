import type { ReportEnvironmentSnapshot } from '../types/report/reportDocument.js';
import type {
  CacheAnalysisState,
  HostedIngestProcessorContext,
  HostPrepareCacheMeta,
  IngestRouteKind,
  MetadataScalar,
  PayloadProcessorEnvironment,
  PayloadProcessorInfo,
  ProjectExtractionCacheMeta,
  ProjectMetadataPrepareTiming,
  ProjectMetadataTiming,
  ProjectStoredMetadata,
} from '../types/project/metadata.js';
import type { ProjectPrepareMeta } from '../types/project/prepare/index.js';
import type { ProjectStoreRow } from '../types/project/store.js';
import type { ProjectSnapshot } from '../types/project/upload.js';
import { WORKER_IDLE_RETENTION_MS } from '../shared/constants/worker.js';
import { resolveProcessorPresentation } from './processorPresets.js';
import { computeMissingLiteralKeysFromResolvedKeys } from '../validate/index.js';

/** ISO `preparedAt` on snapshot rows. */
export function snapshotPreparedAtIso(snapshot: ProjectSnapshot): string {
  const raw = snapshot.preparedAt ?? '';
  return typeof raw === 'string' ? raw : '';
}

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
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return value;
}

export function msOrDash(value: unknown): MetadataScalar {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

export function isoMsDelta(start: unknown, end: unknown): MetadataScalar {
  const s = isoOrDash(start);
  const e = isoOrDash(end);
  if (s === null || e === null) return null;
  return msOrDash(Date.parse(e as string) - Date.parse(s as string));
}

function environmentDisplay(env: ReportEnvironmentSnapshot | undefined): PayloadProcessorEnvironment | null {
  if (!env) return null;
  return {
    platform: typeof env.platform === 'string' && env.platform.length > 0 && env.platform !== '-' ? env.platform : null,
    arch: typeof env.arch === 'string' && env.arch.length > 0 && env.arch !== '-' ? env.arch : null,
    nodeVersion:
      typeof env.nodeVersion === 'string' && env.nodeVersion.length > 0 && env.nodeVersion !== '-'
        ? env.nodeVersion
        : null,
    osRelease:
      typeof env.osRelease === 'string' && env.osRelease.length > 0 && env.osRelease !== '-'
        ? env.osRelease
        : null,
    ...(env.distro !== undefined ? { distro: env.distro.length > 0 && env.distro !== '-' ? env.distro : null } : {}),
    ...(env.wslDistroName !== undefined
      ? { wslDistroName: env.wslDistroName.length > 0 && env.wslDistroName !== '-' ? env.wslDistroName : null }
      : {}),
    runtimeFamily:
      typeof env.runtimeFamily === 'string' && env.runtimeFamily.length > 0 ? env.runtimeFamily : null,
  };
}

export function buildExtractionCacheMeta(
  hostCache: HostPrepareCacheMeta | undefined,
  ingestRoute: IngestRouteKind,
): ProjectExtractionCacheMeta {
  const normalizeAnalysis = (value: HostPrepareCacheMeta['analysis']): CacheAnalysisState =>
    value === 'bypass' ? 'bypassed' : value;
  if (hostCache) {
    return {
      analysis: normalizeAnalysis(hostCache.analysis),
      analysisReason: hostCache.analysisReason,
      timingsTrustworthy: hostCache.timingsTrustworthy,
      filesEpoch: hostCache.filesEpoch,
      projectCacheEnabled: hostCache.projectCacheEnabled,
      available: true,
    };
  }
  if (ingestRoute === 'archive') {
    return {
      analysis: 'disabled',
      analysisReason: 'archive_ingest_no_project_cache',
      timingsTrustworthy: true,
      filesEpoch: null,
      projectCacheEnabled: false,
      available: true,
    };
  }
  return {
    analysis: null,
    analysisReason: null,
    timingsTrustworthy: false,
    filesEpoch: null,
    projectCacheEnabled: false,
    available: false,
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
  const preparedAt = snapshotPreparedAtIso(snapshot);
  const zipIso = isoMsDelta(snapshot.requestReceivedAt ?? preparedAt, preparedAt);
  const extractIso = isoMsDelta(
    snapshot.extraction?.extractionStartedAt ?? preparedAt,
    snapshot.extraction?.computedAt,
  );
  const totalIso = isoMsDelta(snapshot.requestReceivedAt ?? preparedAt, snapshot.extraction?.computedAt);

  const zipParsedMs = preferPositiveMs(prepareMeta?.zipParsedMs, zipIso);
  const extractionMs = preferPositiveMs(prepareMeta?.extractionMs, extractIso);
  let totalMs = preferPositiveMs(prepareMeta?.totalMs, totalIso);

  if (
    typeof totalMs === 'number' &&
    totalMs > 0 &&
    (extractionMs === 0 || extractionMs === null) &&
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
  const preparedAt = snapshotPreparedAtIso(snap);
  const requestReceivedAt = isoOrDash(snap.requestReceivedAt ?? preparedAt);
  const preparedAtMeta = isoOrDash(preparedAt);
  const extractionStartedAt = isoOrDash(extraction?.extractionStartedAt ?? preparedAt);
  const extractionComputedAt = isoOrDash(extraction?.computedAt);
  const storedAt = isoOrDash(snap.storedAt ?? extraction?.computedAt);

  const extractionDuration = preferPositiveMs(
    input.prepareMeta?.extractionMs,
    isoMsDelta(extraction?.extractionStartedAt ?? preparedAt, extraction?.computedAt),
  );

  return {
    preparedAt: preparedAtMeta,
    requestReceivedAt,
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
  if (base === null) return null;
  return new Date(Date.parse(base as string) + WORKER_IDLE_RETENTION_MS).toISOString();
}

function buildProjectExtractionSummary(
  snapshot: ProjectSnapshot,
): {
  configHash: MetadataScalar;
  sourceLocalePath: MetadataScalar;
  srcRoot: MetadataScalar;
  localesDir: MetadataScalar;
  keyObservationsCount: number;
  dynamicSitesCount: number;
} | null {
  const extraction = snapshot.extraction;
  if (!extraction) return null;
  return {
    configHash: extraction.configHash.length > 0 ? extraction.configHash : null,
    sourceLocalePath: extraction.sourceLocalePath.length > 0 ? extraction.sourceLocalePath : null,
    srcRoot: extraction.srcRoot.length > 0 ? extraction.srcRoot : null,
    localesDir: extraction.localesDir.length > 0 ? extraction.localesDir : null,
    keyObservationsCount: extraction.keyObservationsCount,
    dynamicSitesCount: extraction.dynamicSitesCount,
  };
}

/** Build metadata for `GET /v1/projects/:id` from a stored row. */
export function buildProjectStoredMetadata(row: ProjectStoreRow): ProjectStoredMetadata {
  const ingestRoute = row.ingestRoute ?? 'prepared';
  const lastAccessedAt = row.lastAccessedAt ?? row.snapshot.storedAt ?? snapshotPreparedAtIso(row.snapshot);
  const localeTags = resolveProjectLocaleTags(row.snapshot);
  const extractionCache = buildExtractionCacheMeta(row.prepareMeta?.hostCache, ingestRoute);
  const extraction = buildProjectExtractionSummary(row.snapshot);
  const missingKeysCount =
    row.snapshot.extraction && row.snapshot.sourceLocaleJson
      ? computeMissingLiteralKeysFromResolvedKeys(
          row.snapshot.sourceLocaleJson,
          new Set(row.snapshot.extraction.resolvedKeys),
        ).length
      : null;
  const processor = buildPayloadProcessorInfo({
    ingestRoute,
    prepareMeta: row.prepareMeta,
    processorContext: row.processorContext,
  });
  const timing = buildProjectMetadataTiming({
    snapshot: row.snapshot,
    prepareMeta: row.prepareMeta,
    lastAccessedAt,
  });
  const readOperations = [
    'metadata',
    'snapshot',
    'tree',
    'validate',
    'review',
    'missing',
    'locales',
    'doctor',
    'report',
  ] as const;
  const expiresAt = expiresAtFromLastAccess(row.lastAccessedAt, row.snapshot.storedAt);
  return {
    schemaVersion: 1,
    formatVersion: 1,
    artifact: {
      kind: 'project',
      id: row.projectId,
      contentHash: row.projectHash,
      byteSize: row.snapshot.zipBytes,
      fileCount: row.snapshot.fileCount,
      textFileCount: row.snapshot.textFileCount,
      detectedConfigPath: row.snapshot.detectedConfigPath,
      localeTags,
    },
    timing,
    processor,
    summary: {
      localeCount: localeTags.length,
      missingKeysCount,
      ok: missingKeysCount === null ? null : missingKeysCount === 0,
    },
    execution: {
      surface: processor.surface,
      host: processor.prepareHost,
      route: processor.route,
      transport: 'https-json',
      computeLocation: 'edge',
    },
    analysis:
      extraction === null
        ? null
        : {
            localeTags,
            detectedConfigPath: row.snapshot.detectedConfigPath,
            configHash: extraction.configHash,
            sourceLocalePath: extraction.sourceLocalePath,
            srcRoot: extraction.srcRoot,
            localesDir: extraction.localesDir,
            keyObservationsCount: extraction.keyObservationsCount,
            dynamicSitesCount: extraction.dynamicSitesCount,
          },
    cache: extractionCache,
    storage: {
      backend: 'durable-object',
      dedupByContentHash: true,
      contentAddressed: true,
    },
    retention: {
      policy: 'idle-7d',
      expiresAt,
      lastAccessedAt: timing.lastAccessedAt,
    },
    capabilities: {
      preparedUploads: true,
      archiveUploads: true,
      readOperations,
      project: true,
      report: false,
    },
  };
}
