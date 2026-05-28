import type { ReportEnvironmentSnapshot } from '../types/report/reportDocument.js';
import type {
  HostedIngestProcessorContext,
  MetadataScalar,
  PayloadProcessorInfo,
  ReportMetadataDocumentTiming,
} from '../types/project/metadata.js';
import type {
  ReportStoreRow,
  StoredReportMetadata,
  StoredReportProjectMeta,
  StoredReportSummary,
} from '../types/project/report/index.js';
import { WORKER_IDLE_RETENTION_MS } from '../shared/constants/worker.js';
import {
  buildPayloadProcessorInfo,
  buildProjectMetadataPrepareTiming,
  isoMsDelta,
  isoOrDash,
} from './storedMetadata.js';

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
    return { sourceLocalePath: null, localesDir: null, srcRoot: null };
  }
  const p = raw as Record<string, unknown>;
  const sourceLocalePath = typeof p.sourceLocalePath === 'string' ? p.sourceLocalePath : null;
  const localesDir = typeof p.localesDir === 'string' ? p.localesDir : null;
  const srcRoot = typeof p.srcRoot === 'string' ? p.srcRoot : null;
  const sourceLocaleTag = typeof p.sourceLocaleTag === 'string' ? p.sourceLocaleTag : undefined;
  return { sourceLocalePath, localesDir, srcRoot, sourceLocaleTag };
}

function readEnvironment(document: Record<string, unknown>): ReportEnvironmentSnapshot | undefined {
  const project = document.project;
  if (!project || typeof project !== 'object' || Array.isArray(project)) return undefined;
  const env = (project as Record<string, unknown>).environment;
  if (!env || typeof env !== 'object' || Array.isArray(env)) return undefined;
  const e = env as Record<string, unknown>;
  const runtimeFamily = e.runtimeFamily;
  if (
    runtimeFamily !== 'windows' &&
    runtimeFamily !== 'darwin' &&
    runtimeFamily !== 'linux' &&
    runtimeFamily !== 'linux-wsl' &&
    runtimeFamily !== 'edge-worker'
  ) {
    return undefined;
  }
  return {
    platform: typeof e.platform === 'string' ? e.platform : '',
    arch: typeof e.arch === 'string' ? e.arch : '',
    nodeVersion: typeof e.nodeVersion === 'string' ? e.nodeVersion : '',
    osRelease: typeof e.osRelease === 'string' ? e.osRelease : '',
    runtimeFamily,
    ...(typeof e.distro === 'string' ? { distro: e.distro } : {}),
    ...(typeof e.wslDistroName === 'string' ? { wslDistroName: e.wslDistroName } : {}),
  };
}

function expiresAtFromLastAccess(lastAccessedAt: string | undefined, storedAt: string): MetadataScalar {
  const base = isoOrDash(lastAccessedAt ?? storedAt);
  if (base === null) return null;
  return new Date(Date.parse(base as string) + WORKER_IDLE_RETENTION_MS).toISOString();
}

function buildReportDocumentTiming(row: ReportStoreRow): ReportMetadataDocumentTiming {
  const preparedAt = isoOrDash(
    typeof row.document.generatedAt === 'string' ? row.document.generatedAt : row.storedAt,
  );
  const storedAt = isoOrDash(row.storedAt);
  const lastAccessedAt = isoOrDash(row.lastAccessedAt ?? row.storedAt);
  const requestReceivedAt = row.requestReceivedAt ? isoOrDash(row.requestReceivedAt) : undefined;
  return {
    preparedAt,
    storedAt,
    lastAccessedAt,
    ...(requestReceivedAt !== undefined ? { requestReceivedAt } : {}),
    ...(row.prepareMeta ? { prepare: buildProjectMetadataPrepareTiming(row.prepareMeta) } : {}),
    edge: {
      persistMs:
        row.prepareMeta?.persistMs !== undefined
          ? row.prepareMeta.persistMs
          : isoMsDelta(preparedAt === null ? undefined : preparedAt, row.storedAt),
    },
  };
}

function resolveReportProcessorContext(row: ReportStoreRow): HostedIngestProcessorContext | undefined {
  if (row.processorContext) return row.processorContext;
  const toolVersion = typeof row.document.toolVersion === 'string' ? row.document.toolVersion : undefined;
  const environment = readEnvironment(row.document);
  if (!toolVersion && !environment) return undefined;
  return { toolVersion, environment };
}

/** Build metadata for `GET /v1/reports/:id` from a stored row (omits full document). */
export function buildStoredReportMetadata(row: ReportStoreRow): StoredReportMetadata {
  const ingestRoute = row.ingestRoute ?? 'prepared';
  const toolVersion =
    typeof row.document.toolVersion === 'string' && row.document.toolVersion.length > 0
      ? row.document.toolVersion
      : null;
  const processor: PayloadProcessorInfo = buildPayloadProcessorInfo({
    ingestRoute,
    prepareMeta: row.prepareMeta ?? (row.prepareHost ? { prepareHost: row.prepareHost } : undefined),
    processorContext: resolveReportProcessorContext(row),
  });
  const timing = buildReportDocumentTiming(row);
  const summary = readSummary(row.document);
  const project = readProject(row.document);
  const expiresAt = expiresAtFromLastAccess(row.lastAccessedAt, row.storedAt);
  const readOperations = ['metadata', 'document'] as const;

  return {
    schemaVersion: 1,
    formatVersion: 1,
    artifact: {
      kind: 'report',
      id: row.reportId,
      contentHash: row.payloadContentHash,
      byteSize: row.byteSize,
      formatVersion: typeof row.document.schemaVersion === 'number' ? row.document.schemaVersion : 0,
      toolVersion,
    },
    timing,
    processor,
    summary,
    execution: {
      surface: processor.surface,
      host: processor.prepareHost,
      route: processor.route,
      transport: 'https-json',
      computeLocation: 'edge',
    },
    analysis: {
      sourceLocalePath: project.sourceLocalePath,
      localesDir: project.localesDir,
      srcRoot: project.srcRoot,
      missingKeysCount: summary.missingKeysCount,
      dynamicSitesCount: summary.dynamicSitesCount,
      keyObservationsCount: summary.keyObservationsCount,
      ok: summary.ok,
    },
    cache: {
      available: false,
      analysis: 'unavailable',
      analysisReason: null,
      timingsTrustworthy: true,
      filesEpoch: null,
      projectCacheEnabled: false,
    },
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
      project: false,
      report: true,
    },
  };
}
