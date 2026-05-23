import {
  basenameNoExt,
  buildReviewJsonData,
  resolveMissingPathsPlan,
  validate,
  type ParsedProjectUpload,
} from '@i18nprune/core';
import {
  PROJECT_REPORT_KIND,
  PROJECT_REPORT_SCHEMA_VERSION,
  type ProjectReportDocument,
} from '@i18nprune/report';

const LOCAL_TOOL_VERSION = 'runtime-web-local/0.1.0';

export function localValidateData(session: ParsedProjectUpload) {
  const { snapshot } = session;
  if (!snapshot.extraction || !snapshot.sourceLocaleJson) {
    throw new Error('EXTRACTION_CACHE_MISSING');
  }
  const resolvedKeys = new Set(snapshot.extraction.resolvedKeys);
  const missing = validate.computeMissingLiteralKeysFromResolvedKeys(snapshot.sourceLocaleJson, resolvedKeys);
  return {
    projectId: snapshot.projectId,
    missing,
    count: snapshot.extraction.keyObservationsCount,
    dynamic: {
      count: snapshot.extraction.dynamicSitesCount,
    },
    keyObservations: {
      count: snapshot.extraction.keyObservationsCount,
    },
  };
}

export function localReviewData(session: ParsedProjectUpload) {
  const { snapshot } = session;
  if (!snapshot.extraction || !snapshot.sourceLocaleJson) {
    throw new Error('EXTRACTION_CACHE_MISSING');
  }
  const sourceLocalePath = snapshot.extraction.sourceLocalePath;
  const sourceTag = basenameNoExt(sourceLocalePath);
  const targetLocaleJsonByFile: Record<string, unknown> = {};
  for (const [tag, json] of Object.entries(snapshot.localeJsonByTag ?? {})) {
    if (tag === sourceTag) continue;
    targetLocaleJsonByFile[`${tag}.json`] = json;
  }
  return {
    projectId: snapshot.projectId,
    ...buildReviewJsonData({
      sourceLocalePath,
      localesDir: snapshot.extraction.localesDir,
      dynamicKeySites: snapshot.extraction.dynamicSitesCount,
      sourceLocaleJson: snapshot.sourceLocaleJson,
      targetLocaleJsonByFile,
    }),
  };
}

export function localMissingData(session: ParsedProjectUpload, targetTag?: string, reportMissingPaths?: string[]) {
  const { snapshot } = session;
  if (!snapshot.extraction || !snapshot.sourceLocaleJson) {
    throw new Error('EXTRACTION_CACHE_MISSING');
  }
  const tag =
    typeof targetTag === 'string' && targetTag.length > 0
      ? targetTag
      : (snapshot.extraction.sourceLocalePath.split('/').pop() ?? 'en').replace(/\.json$/, '');
  const localeJson = (snapshot.localeJsonByTag ?? {})[tag];
  if (!localeJson) {
    const err = new Error(`Locale not found for target tag: ${tag}`);
    (err as Error & { code?: string }).code = 'LOCALE_NOT_FOUND';
    throw err;
  }
  const plan = resolveMissingPathsPlan({
    localeJson,
    resolvedKeys: new Set(snapshot.extraction.resolvedKeys),
    reportMissingPaths: Array.isArray(reportMissingPaths) ? reportMissingPaths : undefined,
  });
  return { projectId: snapshot.projectId, targetTag: tag, toAdd: plan.toAdd, skippedNotInScan: plan.skippedNotInScan };
}

export function localReportData(session: ParsedProjectUpload) {
  const { snapshot } = session;
  if (!snapshot.extraction || !snapshot.sourceLocaleJson) {
    throw new Error('EXTRACTION_CACHE_MISSING');
  }
  const extraction = snapshot.extraction;
  const sourceLocalePath = extraction.sourceLocalePath;
  const srcRoot = extraction.srcRoot;
  const localesDir = extraction.localesDir;
  const resolvedKeys = new Set(extraction.resolvedKeys);
  const missing = validate.computeMissingLiteralKeysFromResolvedKeys(snapshot.sourceLocaleJson, resolvedKeys);
  const document: ProjectReportDocument = {
    kind: PROJECT_REPORT_KIND,
    schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    toolVersion: LOCAL_TOOL_VERSION,
    project: {
      cwd: '/project',
      sourceLocalePath,
      localesDir,
      srcRoot,
      sourceLocaleTag: basenameNoExt(sourceLocalePath),
      environment: {
        platform: 'browser',
        arch: '-',
        nodeVersion: '-',
        osRelease: '-',
        distro: '-',
      },
    },
    summary: {
      missingKeysCount: missing.length,
      dynamicSitesCount: extraction.dynamicSitesCount,
      keyObservationsCount: extraction.keyObservationsCount,
      ok: missing.length === 0,
    },
    details: {
      missingKeys: missing,
      dynamicSites: extraction.dynamicSitesPreview,
      keyObservations: extraction.keyObservationsPreview,
    },
  };
  return {
    kind: 'report' as const,
    format: 'json' as const,
    outputPath: null,
    document,
  };
}
