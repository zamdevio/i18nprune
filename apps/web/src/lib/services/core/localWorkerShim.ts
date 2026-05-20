import type { ParsedProjectUpload, WorkerApiEnvelope } from '@i18nprune/core';
import { okEnvelope } from '../api/client';
import {
  localMissingData,
  localReportData,
  localReviewData,
  localValidateData,
} from './buildLocalProject';
export function localGetMetadata(session: ParsedProjectUpload): WorkerApiEnvelope<unknown> {
  const s = session.snapshot;
  const localeJsonByTag = s.localeJsonByTag ?? {};
  return okEnvelope({
    projectId: session.snapshot.projectId,
    projectHash: session.snapshot.projectHash,
    uploadedAt: s.uploadedAt,
    zipBytes: s.zipBytes,
    fileCount: s.fileCount,
    textFileCount: s.textFileCount,
    detectedConfigPath: s.detectedConfigPath,
    localeTags: Object.keys(localeJsonByTag).sort((a, b) => a.localeCompare(b)),
    extraction: s.extraction
      ? {
          configHash: s.extraction.configHash,
          sourceLocalePath: s.extraction.sourceLocalePath,
          srcRoot: s.extraction.srcRoot,
          localesDir: s.extraction.localesDir,
          keyObservationsCount: s.extraction.keyObservationsCount,
          dynamicSitesCount: s.extraction.dynamicSitesCount,
          computedAt: s.extraction.computedAt,
        }
      : null,
  });
}

export function localGetTree(session: ParsedProjectUpload): WorkerApiEnvelope<unknown> {
  const s = session.snapshot;
  return okEnvelope({
    projectId: session.snapshot.projectId,
    tree: s.tree,
    stats: {
      fileCount: s.fileCount,
      textFileCount: s.textFileCount,
      zipBytes: s.zipBytes,
    },
  });
}

export function localGetSnapshot(session: ParsedProjectUpload): WorkerApiEnvelope<unknown> {
  return okEnvelope({
    projectId: session.snapshot.projectId,
    snapshot: session.snapshot,
  });
}

export function localRunValidate(session: ParsedProjectUpload): WorkerApiEnvelope<unknown> {
  return okEnvelope(localValidateData(session));
}

export function localRunReview(session: ParsedProjectUpload): WorkerApiEnvelope<unknown> {
  return okEnvelope(localReviewData(session));
}

export function localRunReport(session: ParsedProjectUpload): WorkerApiEnvelope<unknown> {
  return okEnvelope(localReportData(session));
}

export function localRunMissing(
  session: ParsedProjectUpload,
  targetTag?: string,
  reportMissingPaths?: string[],
): WorkerApiEnvelope<unknown> {
  return okEnvelope(localMissingData(session, targetTag, reportMissingPaths));
}

export function localGetLocales(session: ParsedProjectUpload): WorkerApiEnvelope<unknown> {
  const s = session.snapshot;
  const localeJsonByTag = s.localeJsonByTag ?? {};
  const tags = Object.keys(localeJsonByTag).sort((a, b) => a.localeCompare(b));
  return okEnvelope({
    projectId: session.snapshot.projectId,
    sourceLocalePath: s.extraction?.sourceLocalePath ?? null,
    localesDir: s.extraction?.localesDir ?? null,
    locales: tags.map((tag) => ({
      tag,
      isSource:
        (s.extraction?.sourceLocalePath ?? '').replace(/^.*\//, '').replace(/\.json$/, '') === tag,
    })),
  });
}

export function localGetLocaleByTag(session: ParsedProjectUpload, tag: string): WorkerApiEnvelope<unknown> {
  const localeJson = (session.snapshot.localeJsonByTag ?? {})[tag];
  if (!localeJson) {
    throw new Error(`Locale not found for tag: ${tag}`);
  }
  return okEnvelope({
    projectId: session.snapshot.projectId,
    tag,
    localeJson,
  });
}

export function localGetDoctor(session: ParsedProjectUpload): WorkerApiEnvelope<unknown> {
  const s = session.snapshot;
  const extraction = s.extraction;
  const checks = [
    { id: 'snapshot_present', ok: true, message: 'Project snapshot exists in browser memory.' },
    { id: 'resolved_config_present', ok: Boolean(s.resolvedConfig), message: 'Resolved config is available.' },
    { id: 'source_locale_present', ok: Boolean(s.sourceLocaleJson), message: 'Source locale JSON is cached.' },
    { id: 'extraction_present', ok: Boolean(extraction), message: 'Extraction cache is available.' },
    { id: 'locales_cached', ok: Object.keys(s.localeJsonByTag ?? {}).length > 0, message: 'Locale JSON map is cached.' },
  ];
  return okEnvelope({
    projectId: session.snapshot.projectId,
    ok: checks.every((x) => x.ok),
    checks,
    stats: {
      fileCount: s.fileCount,
      textFileCount: s.textFileCount,
      localeCount: Object.keys(s.localeJsonByTag ?? {}).length,
    },
  });
}
