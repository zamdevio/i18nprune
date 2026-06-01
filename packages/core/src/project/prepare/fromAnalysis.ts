import { resolveProjectAnalysis } from '../../analysis/index.js';
import { readLocaleJsonFromContextSync } from '../../shared/locales/read/index.js';
import { buildLocaleJsonByTagFromArchive, listLocaleCodesFromArchive } from '../../shared/locales/archive/buildLocaleJsonByTag.js';
import { ISSUE_PROJECT_SOURCE_LOCALE_INVALID_SHAPE } from '../../shared/constants/issueCodes.js';
import { PROJECT_REPORT_KIND, PROJECT_REPORT_SCHEMA_VERSION } from '../../shared/constants/report.js';
import { computeMissingLiteralKeysFromResolvedKeys } from '../../validate/index.js';
import type { CoreContext } from '../../types/context/index.js';
import type { ProjectAnalysis, ProjectAnalysisResolveOptions } from '../../types/analysis/index.js';
import type { ApplyProjectAnalysisInput } from '../../types/project/applyAnalysis.js';
import type { ProjectSnapshot } from '../../types/project/upload.js';
import type { BuildReportDocumentFromAnalysisInput } from '../../types/report/buildFromAnalysis.js';
import { projectConfigHash } from '../normalizeConfig.js';

/** Fills snapshot locale maps and extraction from a single {@link ProjectAnalysis} pass (no re-scan). */
export async function applyProjectAnalysisToSnapshot(input: ApplyProjectAnalysisInput): Promise<void> {
  const { snapshot, analysis, normalized, ctx, textFiles, projectRoot } = input;
  const absRoot = ctx.adapters.path.resolve(projectRoot);
  const sourceAbs = ctx.paths.sourceLocale;
  const sourceRel = ctx.adapters.path.relative(absRoot, sourceAbs).replace(/\\/g, '/');
  const sourceRaw = textFiles[sourceRel] ?? readLocaleJsonFromContextSync(ctx, ctx.paths.sourceLocale);
  const sourceLocaleJson = typeof sourceRaw === 'string' ? (JSON.parse(sourceRaw) as unknown) : sourceRaw;
  if (!sourceLocaleJson || typeof sourceLocaleJson !== 'object' || Array.isArray(sourceLocaleJson)) {
    throw new Error(ISSUE_PROJECT_SOURCE_LOCALE_INVALID_SHAPE);
  }

  const localesDirAbs = ctx.adapters.path.resolve(absRoot, normalized.localesDir);
  snapshot.sourceLocaleJson = sourceLocaleJson as Record<string, unknown>;
  const localesConfig = {
    source: normalized.source,
    directory: normalized.localesDir,
    mode: normalized.localesMode,
    structure: normalized.localesStructure,
  };
  const archiveRelPaths = Object.keys(textFiles);
  const resolveArchiveAbsolute = (rel: string) => ctx.adapters.path.resolve(absRoot, rel);
  snapshot.localeJsonByTag = buildLocaleJsonByTagFromArchive({
    localesDirAbsolute: localesDirAbs,
    sourceLocaleAbsolute: sourceAbs,
    archiveRelPaths,
    resolveArchiveAbsolute,
    path: ctx.adapters.path,
    locales: localesConfig,
    readText: (rel) => textFiles[rel],
  });
  const tagsFromMap = Object.keys(snapshot.localeJsonByTag);
  snapshot.localeTags =
    tagsFromMap.length > 0
      ? tagsFromMap.sort((a, b) => a.localeCompare(b))
      : listLocaleCodesFromArchive({
          localesDirAbsolute: localesDirAbs,
          archiveRelPaths,
          resolveArchiveAbsolute,
          path: ctx.adapters.path,
          locales: localesConfig,
        });

  const extractionStartedAt = new Date().toISOString();
  snapshot.extraction = {
    configHash: await projectConfigHash(normalized),
    sourceLocalePath: sourceRel,
    srcRoot: normalized.src,
    localesDir: normalized.localesDir,
    resolvedKeys: [...analysis.usage.resolvedKeys],
    keyObservationsCount: analysis.counts.keyObservations,
    dynamicSitesCount: analysis.counts.dynamicSites,
    keyObservationsPreview: analysis.keyObservations,
    dynamicSitesPreview: analysis.dynamicSites,
    extractionStartedAt,
    computedAt: new Date().toISOString(),
  };
}

/** Builds a hosted report document without calling {@link resolveProjectAnalysis} again. */
export function buildReportDocumentFromAnalysis(
  input: BuildReportDocumentFromAnalysisInput,
): { document: Record<string, unknown>; dynamicSitesCount: number } {
  const { ctx, analysis, environment, cwd, toolVersion } = input;
  const { keyObservations, dynamicSites, missingKeys, counts } = analysis;
  const sourceLocaleTag = ctx.adapters.path.basename(ctx.paths.sourceLocale, '.json');

  const document: Record<string, unknown> = {
    kind: PROJECT_REPORT_KIND,
    schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    toolVersion,
    project: {
      cwd,
      sourceLocalePath: ctx.paths.sourceLocale,
      localesDir: ctx.paths.localesDir,
      srcRoot: ctx.paths.srcRoot,
      sourceLocaleTag,
      environment: {
        platform: environment.platform,
        arch: environment.arch,
        nodeVersion: environment.nodeVersion,
        osRelease: environment.osRelease,
        ...(environment.distro !== undefined ? { distro: environment.distro } : {}),
        runtimeFamily: environment.runtimeFamily,
        ...(environment.wslDistroName !== undefined ? { wslDistroName: environment.wslDistroName } : {}),
      },
    },
    summary: {
      missingKeysCount: counts.missingKeys,
      dynamicSitesCount: counts.dynamicSites,
      keyObservationsCount: counts.keyObservations,
      sourceFilesScannedCount: counts.sourceFilesScanned,
      ok: counts.missingKeys === 0,
    },
    details: {
      missingKeys,
      dynamicSites: dynamicSites as unknown[],
      keyObservations: keyObservations as unknown[],
    },
  };

  return { document, dynamicSitesCount: dynamicSites.length };
}

/** Resolves analysis once (respecting cache policy via {@link CoreContext}). */
export function resolveShareProjectAnalysis(
  ctx: CoreContext,
  opts: ProjectAnalysisResolveOptions = {},
): ProjectAnalysis {
  return resolveProjectAnalysis(ctx, { ...opts, op: opts.op ?? 'share' });
}

/** Reconstructs a report document from a prepared project snapshot (archive / worker zip path). */
export function buildReportDocumentFromPreparedSnapshot(
  snapshot: ProjectSnapshot,
  host: Pick<BuildReportDocumentFromAnalysisInput, 'environment' | 'cwd' | 'toolVersion'>,
): Record<string, unknown> {
  const extraction = snapshot.extraction;
  if (!extraction) throw new Error('snapshot.extraction is required');
  if (!snapshot.sourceLocaleJson) throw new Error('snapshot.sourceLocaleJson is required');
  const missing = computeMissingLiteralKeysFromResolvedKeys(
    snapshot.sourceLocaleJson,
    new Set(extraction.resolvedKeys),
  );
  const sourceLocaleTag =
    extraction.sourceLocalePath.split('/').pop()?.replace(/\.json$/i, '') ?? 'source';

  return {
    kind: PROJECT_REPORT_KIND,
    schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
    generatedAt: extraction.computedAt,
    toolVersion: host.toolVersion,
    project: {
      cwd: host.cwd,
      sourceLocalePath: extraction.sourceLocalePath,
      localesDir: extraction.localesDir,
      srcRoot: extraction.srcRoot,
      sourceLocaleTag,
      environment: host.environment,
    },
    summary: {
      missingKeysCount: missing.length,
      dynamicSitesCount: extraction.dynamicSitesCount,
      keyObservationsCount: extraction.keyObservationsCount,
      sourceFilesScannedCount: 0,
      ok: missing.length === 0,
    },
    details: {
      missingKeys: missing,
      dynamicSites: extraction.dynamicSitesPreview ?? [],
      keyObservations: extraction.keyObservationsPreview ?? [],
    },
  };
}
