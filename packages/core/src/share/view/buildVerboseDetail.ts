import type { ProjectStoredMetadata } from '../../types/project/metadata.js';
import type { StoredReportMetadata } from '../../types/project/report/index.js';
import type { ShareCacheEntry } from '../../types/share/entry.js';
import type { ShareViewResult } from '../../types/share/shareRun.js';
import type { ShareViewVerboseDetail, ShareViewVerboseSection } from '../../types/share/viewDetail.js';

function projectProcessorSection(p: ProjectStoredMetadata['processor']): ShareViewVerboseSection {
  const env = p.environment;
  const section: ShareViewVerboseSection = {
    surface: p.surface,
    surfaceLabel: p.surfaceLabel,
    route: p.route,
    routeLabel: p.routeLabel,
    prepareHost: p.prepareHost,
    sdk: p.sdk,
    sdkVersion: p.sdkVersion,
    toolVersion: p.toolVersion,
    prepareSummary: p.prepareSummary,
  };
  if (env) {
    section.runtime = env.runtimeFamily;
    section.platform = env.platform;
    section.arch = env.arch;
    section.node = env.nodeVersion;
    section.osRelease = env.osRelease;
    if (env.distro !== undefined) section.distro = env.distro;
    if (env.wslDistroName !== undefined) section.wslDistro = env.wslDistroName;
  }
  return section;
}

function projectExtractionSection(ex: ProjectStoredMetadata['analysis']): ShareViewVerboseSection | undefined {
  if (!ex) return undefined;
  return {
    configHash: ex.configHash,
    srcRoot: ex.srcRoot,
    localesDir: ex.localesDir,
    sourceLocale: ex.sourceLocalePath,
    observations: ex.keyObservationsCount,
    dynamicSites: ex.dynamicSitesCount,
  };
}

function projectCacheSection(c: ProjectStoredMetadata['cache']): ShareViewVerboseSection {
  return {
    analysis: c.analysis,
    reason: c.analysisReason,
    timingsTrustworthy: c.timingsTrustworthy,
    filesEpoch: c.filesEpoch,
    projectCacheEnabled: c.projectCacheEnabled,
    available: c.available,
  };
}

function projectTimingsSection(t: ProjectStoredMetadata['timing']): ShareViewVerboseSection {
  return {
    preparedAt: t.preparedAt,
    requestReceivedAt: t.requestReceivedAt,
    storedAt: t.storedAt,
    lastAccessedAt: t.lastAccessedAt,
    'prepare.totalMs': t.prepare.totalMs,
    'prepare.zipParsedMs': t.prepare.zipParsedMs,
    'prepare.analysisMs': t.prepare.analysisMs,
    'prepare.extractionMs': t.prepare.extractionMs,
    'extraction.startedAt': t.extraction.startedAt,
    'extraction.computedAt': t.extraction.computedAt,
    'extraction.durationMs': t.extraction.durationMs,
  };
}

function projectEdgeSection(t: ProjectStoredMetadata['timing']): ShareViewVerboseSection {
  return {
    persistMs: t.edge.persistMs,
  };
}

function projectSnapshotSection(m: ProjectStoredMetadata): ShareViewVerboseSection {
  return {
    projectHash: m.artifact.contentHash,
    zipBytes: m.artifact.byteSize,
    fileCount: m.artifact.fileCount,
    textFileCount: m.artifact.textFileCount,
    detectedConfigPath: m.artifact.detectedConfigPath,
    localeTags: m.artifact.localeTags,
    expiresAt: m.retention.expiresAt,
    schemaVersion: m.schemaVersion,
    formatVersion: m.formatVersion,
  };
}

function localSection(local: ShareCacheEntry): ShareViewVerboseSection {
  const base: ShareViewVerboseSection = {
    kind: local.kind,
    workerBaseUrl: local.workerBaseUrl,
    payloadContentHash: local.payloadContentHash,
    byteSize: local.byteSize,
    uploadedAt: local.uploadedAt,
    lastUsedAt: local.lastUsedAt,
  };
  if (local.kind === 'project') {
    if (local.configHash) base.configHash = local.configHash;
    if (local.inputFilesEpoch) base.inputFilesEpoch = local.inputFilesEpoch;
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
      persistMs: (edge?.persistMs ?? null) as string | number | boolean | null,
    },
  };
  if (res.kind === 'project') {
    detail.snapshot = {
      fileCount: r.fileCount as string | number | boolean | null,
      zipBytes: r.zipBytes as string | number | boolean | null,
      expiresAt: r.expiresAt as string | number | boolean | null,
      projectHash: r.projectHash as string | number | boolean | null,
    };
  } else {
    const summary = r.summary as Record<string, unknown> | undefined;
    detail.extraction = {
      schemaVersion: r.schemaVersion as string | number | boolean | null,
      byteSize: r.byteSize as string | number | boolean | null,
      ok: (summary?.ok ?? null) as string | number | boolean | null,
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
    const extraction = projectExtractionSection(m.analysis);
    const cache = projectCacheSection(m.cache);
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
      surface: p.surface,
      route: p.route,
      sdk: p.sdk,
      sdkVersion: p.sdkVersion,
      toolVersion: p.toolVersion,
      prepareHost: p.prepareHost,
    };
    if (env) {
      processor.runtime = env.runtimeFamily;
      processor.platform = env.platform;
      processor.node = env.nodeVersion;
      processor.arch = env.arch;
      processor.osRelease = env.osRelease;
    }
    return {
      kind: 'report',
      workerId: res.workerId,
      processor,
      extraction: {
        formatVersion: m.artifact.formatVersion,
        byteSize: m.artifact.byteSize,
        missingKeys: m.summary.missingKeysCount,
        dynamicSites: m.summary.dynamicSitesCount,
        keyObservations: m.summary.keyObservationsCount,
        ok: m.summary.ok,
        sourceLocale: m.analysis.sourceLocalePath,
        localesDir: m.analysis.localesDir,
        srcRoot: m.analysis.srcRoot,
      },
      snapshot: {
        payloadContentHash: m.artifact.contentHash,
        expiresAt: m.retention.expiresAt,
        schemaVersion: m.schemaVersion,
        formatVersion: m.formatVersion,
      },
      cache: projectCacheSection(m.cache),
      timings: {
        ...(m.timing.requestReceivedAt !== undefined
          ? { requestReceivedAt: m.timing.requestReceivedAt }
          : {}),
        preparedAt: m.timing.preparedAt,
        storedAt: m.timing.storedAt,
        lastAccessedAt: m.timing.lastAccessedAt,
        ...(m.timing.prepare
          ? {
              'prepare.totalMs': m.timing.prepare.totalMs,
              'prepare.zipParsedMs': m.timing.prepare.zipParsedMs,
              'prepare.analysisMs': m.timing.prepare.analysisMs,
              'prepare.extractionMs': m.timing.prepare.extractionMs,
            }
          : {}),
      },
      edge: {
        persistMs: m.timing.edge.persistMs,
      },
      ...(res.local ? { local: localSection(res.local) } : {}),
      links,
    };
  }

  return minimalVerboseFromRemote(res, links);
}
