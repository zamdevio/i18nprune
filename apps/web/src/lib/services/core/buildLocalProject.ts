import { buildReviewJsonData, extractor, mergePartialConfigIntoBase, resolveMissingPathsPlan, validate } from '@i18nprune/core';
import { webPathRuntime } from '@i18nprune/core/runtime/web';
import {
  PROJECT_REPORT_KIND,
  PROJECT_REPORT_SCHEMA_VERSION,
  type ProjectReportDocument,
} from '@i18nprune/report';
import { hex16Id, sha256Hex } from './cryptoUtils';
import { basenameNoExt, configHash, normalizeConfig, relativeProjectPath } from './configUtils';
import { parseZipToSnapshot, type ProjectSnapshot } from './projectZip';

export type LocalProjectSession = {
  projectId: string;
  projectHash: string;
  snapshot: ProjectSnapshot;
  textFiles: Record<string, string>;
};

const LOCAL_TOOL_VERSION = 'runtime-web-local/0.1.0';

export async function buildLocalProjectFromZip(
  zipBytes: Uint8Array,
  options?: { configJson?: string },
): Promise<LocalProjectSession> {
  const projectId = hex16Id();
  const projectHash = await sha256Hex(zipBytes);
  const parsedUpload = parseZipToSnapshot(projectId, projectHash, zipBytes);
  const snapshot = parsedUpload.snapshot;

  if (typeof options?.configJson === 'string' && options.configJson.trim()) {
    try {
      const parsed = JSON.parse(options.configJson) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid configJson payload: expected valid JSON object');
      }
      snapshot.resolvedConfig = mergePartialConfigIntoBase(snapshot.resolvedConfig, parsed as Record<string, unknown>);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Invalid configJson')) throw e;
      throw new Error('Invalid configJson payload: expected valid JSON object');
    }
  }

  const normalized = normalizeConfig(snapshot.resolvedConfig);
  if (!normalized) {
    throw new Error(
      'Config required. Pass configJson, include i18nprune.config.json, or use a parseable i18nprune.config.ts/js with locales.source, locales.directory, src, and functions[].',
    );
  }

  const srcRootAbs = webPathRuntime.resolve('/project', normalized.src);
  const sourceAbs = webPathRuntime.resolve('/project', normalized.source);
  const sourceRaw = parsedUpload.textFiles[relativeProjectPath(sourceAbs)];
  if (!sourceRaw) {
    throw new Error(`Configured source locale file not found in uploaded zip: ${normalized.source}`);
  }
  let sourceLocaleJson: unknown;
  try {
    sourceLocaleJson = JSON.parse(sourceRaw) as unknown;
  } catch {
    throw new Error(`Configured source locale is invalid JSON: ${normalized.source}`);
  }
  if (!sourceLocaleJson || typeof sourceLocaleJson !== 'object' || Array.isArray(sourceLocaleJson)) {
    throw new Error('Configured source locale must be a JSON object.');
  }

  const allPaths = Object.keys(parsedUpload.textFiles);
  const listFiles = (srcRootPath: string): string[] => {
    const root = srcRootPath.endsWith('/') ? srcRootPath : `${srcRootPath}/`;
    return allPaths
      .map((p) => webPathRuntime.resolve('/project', p))
      .filter((abs) => abs === srcRootPath || abs.startsWith(root));
  };
  const readFile = (filePath: string): string => {
    const rel = relativeProjectPath(filePath);
    const raw = parsedUpload.textFiles[rel];
    if (typeof raw !== 'string') throw new Error(`missing file ${filePath}`);
    return raw;
  };

  const observations = extractor.scanProjectKeyObservations({
    srcRoot: srcRootAbs,
    cwd: '/project',
    path: webPathRuntime,
    readFile,
    listFiles,
    functions: normalized.functions,
    exclude: normalized.exclude,
  });
  const resolvedKeys = extractor.resolvedKeysFromObservations(observations);
  const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites({
    srcRoot: srcRootAbs,
    cwd: '/project',
    path: webPathRuntime,
    readFile,
    listFiles,
    functions: normalized.functions,
    exclude: normalized.exclude,
  });

  snapshot.sourceLocaleJson = sourceLocaleJson as Record<string, unknown>;
  const localesRootAbs = webPathRuntime.resolve('/project', normalized.localesDir);
  const localesRootPrefix = localesRootAbs.endsWith('/') ? localesRootAbs : `${localesRootAbs}/`;
  const localeJsonByTag: Record<string, Record<string, unknown>> = {};
  for (const relPath of Object.keys(parsedUpload.textFiles)) {
    if (!relPath.endsWith('.json')) continue;
    const absPath = webPathRuntime.resolve('/project', relPath);
    if (absPath !== localesRootAbs && !absPath.startsWith(localesRootPrefix)) continue;
    const raw = parsedUpload.textFiles[relPath];
    if (typeof raw !== 'string') continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
      const tag = basenameNoExt(relPath);
      localeJsonByTag[tag] = parsed as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }
  snapshot.localeJsonByTag = localeJsonByTag;
  snapshot.extraction = {
    configHash: await configHash(normalized),
    sourceLocalePath: normalized.source,
    srcRoot: normalized.src,
    localesDir: normalized.localesDir,
    resolvedKeys: [...resolvedKeys],
    keyObservationsCount: observations.length,
    dynamicSitesCount: dynamicSites.length,
    keyObservationsPreview: observations,
    dynamicSitesPreview: dynamicSites,
    computedAt: new Date().toISOString(),
  };

  return { projectId, projectHash, snapshot, textFiles: parsedUpload.textFiles };
}

export function localValidateData(session: LocalProjectSession) {
  const { snapshot, projectId } = session;
  if (!snapshot.extraction || !snapshot.sourceLocaleJson) {
    throw new Error('EXTRACTION_CACHE_MISSING');
  }
  const resolvedKeys = new Set(snapshot.extraction.resolvedKeys);
  const missing = validate.computeMissingLiteralKeysFromResolvedKeys(snapshot.sourceLocaleJson, resolvedKeys);
  return {
    projectId,
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

export function localReviewData(session: LocalProjectSession) {
  const { snapshot, projectId } = session;
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
    projectId,
    ...buildReviewJsonData({
      sourceLocalePath,
      localesDir: snapshot.extraction.localesDir,
      dynamicKeySites: snapshot.extraction.dynamicSitesCount,
      sourceLocaleJson: snapshot.sourceLocaleJson,
      targetLocaleJsonByFile,
    }),
  };
}

export function localMissingData(session: LocalProjectSession, targetTag?: string, reportMissingPaths?: string[]) {
  const { snapshot, projectId } = session;
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
  return { projectId, targetTag: tag, toAdd: plan.toAdd, skippedNotInScan: plan.skippedNotInScan };
}

export function localReportData(session: LocalProjectSession) {
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
