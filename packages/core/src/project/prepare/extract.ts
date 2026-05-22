import { mergePartialConfigIntoBase } from '../../config/index.js';
import * as extractor from '../../namespaces/extractor.js';
import { buildLocaleJsonByTagFromArchive } from '../../shared/locales/index.js';
import type { ProjectSnapshot } from '../../types/project/upload.js';
import type { NormalizedProjectConfig } from '../../types/project/config.js';
import { normalizeProjectConfig, projectConfigHash, relativeProjectPath } from '../normalizeConfig.js';
import type { ArchiveProjectFs } from './archiveFs.js';

export type FillProjectSnapshotExtractionInput = {
  snapshot: ProjectSnapshot;
  textFiles: Record<string, string>;
  fs: ArchiveProjectFs;
  configOverride?: string;
};

export type FillProjectSnapshotExtractionResult =
  | { ok: true; normalized: NormalizedProjectConfig; extractionStartedAt: string; computedAt: string }
  | { ok: false; code: string; message: string };

function workerIssue(code: string, message: string): FillProjectSnapshotExtractionResult {
  return { ok: false, code, message };
}

/**
 * Merges optional config, normalizes, runs upload-time extraction into `snapshot`.
 * Error `code` values align with worker `POST /v1/projects/archive` responses.
 */
export async function fillProjectSnapshotExtraction(
  input: FillProjectSnapshotExtractionInput,
): Promise<FillProjectSnapshotExtractionResult> {
  const { snapshot, textFiles, fs } = input;

  if (typeof input.configOverride === 'string' && input.configOverride.trim()) {
    try {
      const parsed = JSON.parse(input.configOverride) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return workerIssue('UPLOAD_CONFIG_JSON_INVALID', 'Invalid configJson payload: expected valid JSON object');
      }
      snapshot.resolvedConfig = mergePartialConfigIntoBase(snapshot.resolvedConfig, parsed as Record<string, unknown>);
    } catch {
      return workerIssue('UPLOAD_CONFIG_JSON_INVALID', 'Invalid configJson payload: expected valid JSON object');
    }
  }

  const normalized = normalizeProjectConfig(snapshot.resolvedConfig);
  if (!normalized) {
    return workerIssue(
      'UPLOAD_CONFIG_REQUIRED',
      'Config required. Pass configJson, include i18nprune.config.json, or use a parseable i18nprune.config.ts/js with locales.source, locales.directory, src, and functions[].',
    );
  }

  const srcRootAbs = fs.path.resolve(fs.cwd, normalized.src);
  const sourceAbs = fs.path.resolve(fs.cwd, normalized.source);
  const sourceRel = relativeProjectPath(sourceAbs);
  const sourceRaw = textFiles[sourceRel];
  if (!sourceRaw) {
    return workerIssue(
      'SOURCE_LOCALE_NOT_FOUND',
      `Configured source locale file not found in uploaded zip: ${normalized.source}`,
    );
  }

  let sourceLocaleJson: unknown;
  try {
    sourceLocaleJson = JSON.parse(sourceRaw) as unknown;
  } catch {
    return workerIssue('SOURCE_LOCALE_INVALID_JSON', `Configured source locale is invalid JSON: ${normalized.source}`);
  }
  if (!sourceLocaleJson || typeof sourceLocaleJson !== 'object' || Array.isArray(sourceLocaleJson)) {
    return workerIssue('SOURCE_LOCALE_INVALID_SHAPE', 'Configured source locale must be a JSON object.');
  }

  const extractionStartedAt = new Date().toISOString();
  const observations = extractor.scanProjectKeyObservations({
    srcRoot: srcRootAbs,
    cwd: fs.cwd,
    path: fs.path,
    readFile: (filePath: string) => fs.readFile(filePath),
    listFiles: (srcRootPath: string) => fs.listFiles(srcRootPath),
    functions: normalized.functions,
    exclude: normalized.exclude,
  });
  const resolvedKeys = extractor.resolvedKeysFromObservations(observations);
  const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites({
    srcRoot: srcRootAbs,
    cwd: fs.cwd,
    path: fs.path,
    readFile: (filePath: string) => fs.readFile(filePath),
    listFiles: (srcRootPath: string) => fs.listFiles(srcRootPath),
    functions: normalized.functions,
    exclude: normalized.exclude,
  });

  snapshot.sourceLocaleJson = sourceLocaleJson as Record<string, unknown>;
  const localesRootAbs = fs.path.resolve(fs.cwd, normalized.localesDir);
  snapshot.localeJsonByTag = buildLocaleJsonByTagFromArchive({
    localesDirAbsolute: localesRootAbs,
    sourceLocaleAbsolute: sourceAbs,
    archiveRelPaths: Object.keys(textFiles),
    resolveArchiveAbsolute: (rel: string) => fs.path.resolve(fs.cwd, rel),
    path: fs.path,
    locales: {
      source: normalized.source,
      directory: normalized.localesDir,
      mode: normalized.localesMode,
      structure: normalized.localesStructure,
    },
    readText: (rel: string) => textFiles[rel],
  });

  const computedAt = new Date().toISOString();
  snapshot.extraction = {
    configHash: await projectConfigHash(normalized),
    sourceLocalePath: normalized.source,
    srcRoot: normalized.src,
    localesDir: normalized.localesDir,
    resolvedKeys: [...resolvedKeys],
    keyObservationsCount: observations.length,
    dynamicSitesCount: dynamicSites.length,
    keyObservationsPreview: observations,
    dynamicSitesPreview: dynamicSites,
    extractionStartedAt,
    computedAt,
  };

  return { ok: true, normalized, extractionStartedAt, computedAt };
}
