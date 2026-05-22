import type { ReportEnvironmentSnapshot } from '../types/report/reportDocument.js';
import type {
  HostedIngestProcessorContext,
  MetadataScalar,
  PayloadProcessorInfo,
  ReportMetadataDocumentTiming,
} from '../types/project/metadata.js';
import { METADATA_DASH } from '../types/project/metadata.js';
import type {
  ReportStoreRow,
  StoredReportMetadata,
  StoredReportProjectMeta,
  StoredReportSummary,
} from '../types/project/reportStore.js';
import {
  buildPayloadProcessorInfo,
  buildProjectMetadataPrepareTiming,
  isoMsDelta,
  isoOrDash,
} from './storedMetadata.js';

const IDLE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

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
    return { sourceLocalePath: METADATA_DASH, localesDir: METADATA_DASH, srcRoot: METADATA_DASH };
  }
  const p = raw as Record<string, unknown>;
  const sourceLocalePath = typeof p.sourceLocalePath === 'string' ? p.sourceLocalePath : METADATA_DASH;
  const localesDir = typeof p.localesDir === 'string' ? p.localesDir : METADATA_DASH;
  const srcRoot = typeof p.srcRoot === 'string' ? p.srcRoot : METADATA_DASH;
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
    runtimeFamily !== 'linux-wsl'
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
  if (base === METADATA_DASH) return METADATA_DASH;
  return new Date(Date.parse(base as string) + IDLE_RETENTION_MS).toISOString();
}

function buildReportDocumentTiming(row: ReportStoreRow): ReportMetadataDocumentTiming {
  const generatedAt = isoOrDash(
    typeof row.document.generatedAt === 'string' ? row.document.generatedAt : row.storedAt,
  );
  const storedAt = isoOrDash(row.storedAt);
  const lastAccessedAt = isoOrDash(row.lastAccessedAt ?? row.storedAt);
  const requestReceivedAt = row.requestReceivedAt ? isoOrDash(row.requestReceivedAt) : undefined;
  return {
    generatedAt,
    storedAt,
    lastAccessedAt,
    ...(requestReceivedAt !== undefined ? { requestReceivedAt } : {}),
    ...(row.prepareMeta ? { prepare: buildProjectMetadataPrepareTiming(row.prepareMeta) } : {}),
    edge: {
      persistMs:
        row.prepareMeta?.persistMs !== undefined
          ? row.prepareMeta.persistMs
          : isoMsDelta(generatedAt === METADATA_DASH ? undefined : generatedAt, row.storedAt),
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
      : METADATA_DASH;
  const processor: PayloadProcessorInfo = buildPayloadProcessorInfo({
    ingestRoute,
    prepareMeta: row.prepareMeta ?? (row.prepareHost ? { prepareHost: row.prepareHost } : undefined),
    processorContext: resolveReportProcessorContext(row),
  });

  return {
    reportId: row.reportId,
    payloadContentHash: row.payloadContentHash,
    byteSize: row.byteSize,
    expiresAt: expiresAtFromLastAccess(row.lastAccessedAt, row.storedAt),
    timing: buildReportDocumentTiming(row),
    processor,
    schemaVersion: typeof row.document.schemaVersion === 'number' ? row.document.schemaVersion : 0,
    toolVersion: toolVersion as string,
    summary: readSummary(row.document),
    project: readProject(row.document),
  };
}
