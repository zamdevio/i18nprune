import { scanProjectDynamicKeySites } from '../extractor/dynamic/orchestrate.js';
import { scanProjectKeyObservations } from '../extractor/keySites/orchestrate.js';
import { literalKeyUsageFromObservations } from '../extractor/keySites/projectUsage.js';
import { readRuntimeFsTextSync } from '../runtime/helpers/sync/index.js';
import { readSourceLocaleLeaves } from '../shared/locales/surface/localeSurface.js';
import { computeMissingLiteralKeysFromLeaves } from '../validate/missingLiterals.js';
import type { ClassifiedSrcDelta } from '../types/cache/index.js';
import type { ProjectAnalysisCacheData } from '../types/analysis/index.js';
import type { CoreContext } from '../types/context/index.js';
import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';
import type { KeyObservation } from '../types/extractor/keySites/index.js';

function normalizeRelPath(path: string): string {
  return path.replace(/\\/g, '/');
}

function pathSet(paths: readonly string[]): Set<string> {
  return new Set(paths.map(normalizeRelPath));
}

function observationPath(obs: KeyObservation): string | undefined {
  return obs.span.filePath !== undefined ? normalizeRelPath(obs.span.filePath) : undefined;
}

function sitePath(site: DynamicKeySite): string | undefined {
  return site.filePath !== undefined ? normalizeRelPath(site.filePath) : undefined;
}

function filterByPaths<T>(rows: T[], pathOf: (row: T) => string | undefined, remove: Set<string>): T[] {
  return rows.filter((row) => {
    const filePath = pathOf(row);
    return filePath === undefined || !remove.has(filePath);
  });
}

function scanInputFromContext(ctx: CoreContext) {
  return {
    srcRoot: ctx.paths.srcRoot,
    functions: ctx.config.functions,
    runtime: ctx.adapters,
    exclude: ctx.config.exclude,
  };
}

function absolutePathsForRel(ctx: CoreContext, relPaths: readonly string[]): string[] {
  const { path, srcRoot } = { path: ctx.adapters.path, srcRoot: ctx.paths.srcRoot };
  return relPaths.map((rel) => path.join(srcRoot, rel));
}

function partialScanIo(ctx: CoreContext, relPaths: readonly string[]) {
  const absPaths = absolutePathsForRel(ctx, relPaths);
  return {
    listFiles: () => absPaths,
    readFile: (filePath: string) => readRuntimeFsTextSync(filePath, ctx.adapters.fs),
  };
}

function scanKeyObservationsForPaths(ctx: CoreContext, relPaths: readonly string[]): KeyObservation[] {
  if (relPaths.length === 0) return [];
  return scanProjectKeyObservations({
    ...scanInputFromContext(ctx),
    ...partialScanIo(ctx, relPaths),
  });
}

function scanDynamicSitesForPaths(ctx: CoreContext, relPaths: readonly string[]): DynamicKeySite[] {
  if (relPaths.length === 0) return [];
  return scanProjectDynamicKeySites({
    ...scanInputFromContext(ctx),
    ...partialScanIo(ctx, relPaths),
  });
}

/**
 * Incrementally patch cached analysis when only src files changed.
 * Recomputes usage-derived counts; keeps `missingKeys` when source locale is unchanged.
 */
export function patchProjectAnalysisFromSrcDelta(
  ctx: CoreContext,
  previous: ProjectAnalysisCacheData,
  srcDelta: ClassifiedSrcDelta,
): ProjectAnalysisCacheData {
  const remove = pathSet([...srcDelta.deleted, ...srcDelta.changed]);
  const rescan = [...srcDelta.added, ...srcDelta.changed];

  const keyObservations = [
    ...filterByPaths(previous.keyObservations, observationPath, remove),
    ...scanKeyObservationsForPaths(ctx, rescan),
  ];
  const dynamicSites = [
    ...filterByPaths(previous.dynamicSites, sitePath, remove),
    ...scanDynamicSitesForPaths(ctx, rescan),
  ];

  const usage = literalKeyUsageFromObservations(keyObservations);
  const sourceLeaves = readSourceLocaleLeaves(ctx);
  const missingKeys = computeMissingLiteralKeysFromLeaves(sourceLeaves, usage.resolvedKeys);
  const sourceFilesScanned = previous.counts.sourceFilesScanned + srcDelta.added.length - srcDelta.deleted.length;

  return {
    version: 1,
    keyObservations,
    dynamicSites,
    missingKeys,
    counts: {
      keyObservations: keyObservations.length,
      dynamicSites: dynamicSites.length,
      sourceFilesScanned: Math.max(0, sourceFilesScanned),
      missingKeys: missingKeys.length,
    },
  };
}

/**
 * Recompute `missingKeys` from the current source locale when only locale segments changed.
 * Scan arrays (`keyObservations`, `dynamicSites`) are unchanged.
 */
export function patchProjectAnalysisFromSourceLocaleDelta(
  ctx: CoreContext,
  previous: ProjectAnalysisCacheData,
): ProjectAnalysisCacheData {
  const usage = literalKeyUsageFromObservations(previous.keyObservations);
  const sourceLeaves = readSourceLocaleLeaves(ctx);
  const missingKeys = computeMissingLiteralKeysFromLeaves(sourceLeaves, usage.resolvedKeys);

  return {
    ...previous,
    missingKeys,
    counts: {
      ...previous.counts,
      missingKeys: missingKeys.length,
    },
  };
}
