import { METADATA_DASH } from '../../types/project/metadata.js';
import type { ProjectStoredMetadata } from '../../types/project/metadata.js';
import type { StoredReportMetadata } from '../../types/project/reportStore.js';
import type { ShareCacheEntry } from '../../types/share/entry.js';
import type { ShareViewResult } from '../../types/share/shareRun.js';
import type { ShareViewVerboseDetail, ShareViewVerboseSection } from '../../types/share/viewDetail.js';

function dash(v: unknown): string {
  if (v === METADATA_DASH) return '—';
  if (typeof v === 'string' && v.length === 0) return '—';
  return String(v);
}

function epochPreview(epoch: unknown): string {
  const s = dash(epoch);
  if (s === '—' || s.length <= 12) return s;
  return `${s.slice(0, 12)}…`;
}

function projectProcessorSection(p: ProjectStoredMetadata['processor']): ShareViewVerboseSection {
  const env = p.environment;
  const section: ShareViewVerboseSection = {
    surface: dash(p.surface),
    surfaceLabel: dash(p.surfaceLabel),
    route: dash(p.route),
    routeLabel: dash(p.routeLabel),
    prepareHost: dash(p.prepareHost),
    sdk: dash(p.sdk),
    sdkVersion: dash(p.sdkVersion),
    toolVersion: dash(p.toolVersion),
    prepareSummary: dash(p.prepareSummary),
  };
  if (env) {
    section.runtime = dash(env.runtimeFamily);
    section.platform = dash(env.platform);
    section.arch = dash(env.arch);
    section.node = dash(env.nodeVersion);
    section.osRelease = dash(env.osRelease);
    if (env.distro !== undefined) section.distro = dash(env.distro);
    if (env.wslDistroName !== undefined) section.wslDistro = dash(env.wslDistroName);
  }
  return section;
}

function projectExtractionSection(ex: ProjectStoredMetadata['extraction']): ShareViewVerboseSection | undefined {
  if (!ex) return undefined;
  return {
    configHash: epochPreview(ex.configHash),
    srcRoot: dash(ex.srcRoot),
    localesDir: dash(ex.localesDir),
    sourceLocale: dash(ex.sourceLocalePath),
    observations: ex.keyObservationsCount,
    dynamicSites: ex.dynamicSitesCount,
  };
}

function projectCacheSection(ex: ProjectStoredMetadata['extraction']): ShareViewVerboseSection | undefined {
  const c = ex?.cache;
  if (!c) return undefined;
  return {
    analysis: dash(c.analysis),
    reason: dash(c.analysisReason),
    timingsTrustworthy: c.timingsTrustworthy,
    filesEpoch: epochPreview(c.filesEpoch),
    projectCacheEnabled: c.projectCacheEnabled,
  };
}

function projectTimingsSection(t: ProjectStoredMetadata['timing']): ShareViewVerboseSection {
  return {
    requestReceivedAt: dash(t.requestReceivedAt),
    uploadedAt: dash(t.uploadedAt),
    storedAt: dash(t.storedAt),
    lastAccessedAt: dash(t.lastAccessedAt),
    'prepare.totalMs': dash(t.prepare.totalMs),
    'prepare.zipParsedMs': dash(t.prepare.zipParsedMs),
    'prepare.analysisMs': dash(t.prepare.analysisMs),
    'prepare.extractionMs': dash(t.prepare.extractionMs),
    'extraction.startedAt': dash(t.extraction.startedAt),
    'extraction.computedAt': dash(t.extraction.computedAt),
    'extraction.durationMs': dash(t.extraction.durationMs),
  };
}

function projectEdgeSection(t: ProjectStoredMetadata['timing']): ShareViewVerboseSection {
  return {
    persistMs: dash(t.edge.persistMs),
    edgeTotalMs: dash(t.edge.totalMs),
  };
}

function projectSnapshotSection(m: ProjectStoredMetadata): ShareViewVerboseSection {
  return {
    projectHash: epochPreview(m.projectHash),
    zipBytes: m.zipBytes,
    fileCount: m.fileCount,
    textFileCount: m.textFileCount,
    detectedConfigPath: dash(m.detectedConfigPath),
    localeTags: m.localeTags.join(','),
    expiresAt: dash(m.expiresAt),
  };
}

function localSection(local: ShareCacheEntry): ShareViewVerboseSection {
  const base: ShareViewVerboseSection = {
    kind: local.kind,
    workerBaseUrl: local.workerBaseUrl,
    payloadContentHash: epochPreview(local.payloadContentHash),
    byteSize: local.byteSize,
    uploadedAt: local.uploadedAt,
    lastUsedAt: local.lastUsedAt,
  };
  if (local.kind === 'project') {
    if (local.configHash) base.configHash = epochPreview(local.configHash);
    if (local.inputFilesEpoch) base.inputFilesEpoch = epochPreview(local.inputFilesEpoch);
    if (local.workerProjectId) base.workerProjectId = local.workerProjectId;
  } else if (local.workerReportId) {
    base.workerReportId = local.workerReportId;
  }
  return base;
}

function linksSection(links: ShareViewResult['links']): ShareViewVerboseSection {
  const out: ShareViewVerboseSection = {};
  if (links.web) out.web = links.web;
  if (links.report) out.report = links.report;
  if (links.worker) out.worker = links.worker;
  return out;
}

function minimalVerboseFromRemote(
  res: ShareViewResult,
  links: ShareViewVerboseSection,
): ShareViewVerboseDetail | undefined {
  if (!res.remote || typeof res.remote !== 'object') return undefined;
  const r = res.remote as Record<string, unknown>;
  const edge = (r.timing as Record<string, unknown> | undefined)?.edge as Record<string, unknown> | undefined;
  const detail: ShareViewVerboseDetail = {
    kind: res.kind,
    workerId: res.workerId,
    processor: { note: 'remote metadata parse unavailable — raw worker row' },
    links,
    edge: {
      persistMs: dash(edge?.persistMs),
      edgeTotalMs: dash(edge?.totalMs),
    },
  };
  if (res.kind === 'project') {
    detail.snapshot = {
      fileCount: dash(r.fileCount),
      zipBytes: dash(r.zipBytes),
      expiresAt: dash(r.expiresAt),
      projectHash: epochPreview(r.projectHash),
    };
  } else {
    const summary = r.summary as Record<string, unknown> | undefined;
    detail.extraction = {
      schemaVersion: dash(r.schemaVersion),
      byteSize: dash(r.byteSize),
      ok: dash(summary?.ok),
    };
  }
  if (res.local) detail.local = localSection(res.local);
  return detail;
}

/** Structured verbose sections for `share view --verbose` (human + JSON). */
export function buildShareViewVerboseDetail(res: ShareViewResult): ShareViewVerboseDetail | undefined {
  const links = linksSection(res.links);

  if (res.kind === 'project' && res.remoteMetadata) {
    const m = res.remoteMetadata as ProjectStoredMetadata;
    const extraction = projectExtractionSection(m.extraction);
    const cache = projectCacheSection(m.extraction);
    return {
      kind: 'project',
      workerId: res.workerId,
      processor: projectProcessorSection(m.processor),
      ...(extraction ? { extraction } : {}),
      snapshot: projectSnapshotSection(m),
      ...(cache ? { cache } : {}),
      timings: projectTimingsSection(m.timing),
      edge: projectEdgeSection(m.timing),
      ...(res.local ? { local: localSection(res.local) } : {}),
      links,
    };
  }

  if (res.kind === 'report' && res.remoteMetadata) {
    const m = res.remoteMetadata as StoredReportMetadata;
    const p = m.processor;
    const env = p.environment;
    const processor: ShareViewVerboseSection = {
      surface: dash(p.surface),
      route: dash(p.route),
      sdk: dash(p.sdk),
      sdkVersion: dash(p.sdkVersion),
      toolVersion: dash(p.toolVersion),
      prepareHost: dash(p.prepareHost),
    };
    if (env) {
      processor.runtime = dash(env.runtimeFamily);
      processor.platform = dash(env.platform);
      processor.node = dash(env.nodeVersion);
    }
    return {
      kind: 'report',
      workerId: res.workerId,
      processor,
      extraction: {
        schemaVersion: m.schemaVersion,
        byteSize: m.byteSize,
        missingKeys: m.summary.missingKeysCount,
        dynamicSites: m.summary.dynamicSitesCount,
        keyObservations: m.summary.keyObservationsCount,
        ok: m.summary.ok,
        sourceLocale: dash(m.project.sourceLocalePath),
        localesDir: dash(m.project.localesDir),
        srcRoot: dash(m.project.srcRoot),
      },
      snapshot: {
        payloadContentHash: epochPreview(m.payloadContentHash),
        expiresAt: dash(m.expiresAt),
      },
      timings: {
        generatedAt: dash(m.timing.generatedAt),
        storedAt: dash(m.timing.storedAt),
        lastAccessedAt: dash(m.timing.lastAccessedAt),
      },
      edge: {
        persistMs: dash(m.timing.edge.persistMs),
        edgeTotalMs: dash(m.timing.edge.totalMs),
      },
      ...(res.local ? { local: localSection(res.local) } : {}),
      links,
    };
  }

  return minimalVerboseFromRemote(res, links);
}
