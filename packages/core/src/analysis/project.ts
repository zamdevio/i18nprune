import { scanProjectDynamicKeySites } from '../extractor/dynamic/orchestrate.js';
import { scanProjectKeyObservations } from '../extractor/keySites/orchestrate.js';
import { literalKeyUsageFromObservations } from '../extractor/keySites/projectUsage.js';
import { emitCacheDispatchMessages, getOrBuildCachedProjectData } from '../cache/index.js';
import { resolveCacheRebuildConfig } from '../cache/rebuildPolicy.js';
import { listSourceFiles } from '../shared/scanner/files.js';
import { computeMissingLiteralKeysFromLeaves } from '../validate/missingLiterals.js';
import { readSourceLocaleLeaves } from '../shared/locales/surface/localeSurface.js';
import { patchProjectAnalysisFromSourceLocaleDelta, patchProjectAnalysisFromSrcDelta } from './rebuild.js';
import type { CacheProducerContext } from '../types/cache/index.js';
import type {
  ProjectAnalysis,
  ProjectAnalysisCacheData,
  ProjectAnalysisCounts,
  ProjectAnalysisResolveOptions,
} from '../types/analysis/index.js';
import type { CoreContext } from '../types/context/index.js';

export type {
  ProjectAnalysis,
  ProjectAnalysisCacheData,
  ProjectAnalysisCounts,
  ProjectAnalysisResolveOptions,
} from '../types/analysis/index.js';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isAnalysisCounts(v: unknown): v is ProjectAnalysisCounts {
  if (!isRecord(v)) return false;
  return (
    typeof v.keyObservations === 'number' &&
    typeof v.dynamicSites === 'number' &&
    typeof v.sourceFilesScanned === 'number' &&
    typeof v.missingKeys === 'number'
  );
}

function parseProjectAnalysisCacheData(data: unknown): { ok: true; data: ProjectAnalysisCacheData } | { ok: false } {
  if (!isRecord(data)) return { ok: false };
  if (data.version !== 1) return { ok: false };
  if (!Array.isArray(data.keyObservations) || !Array.isArray(data.dynamicSites)) return { ok: false };
  if (!Array.isArray(data.missingKeys)) return { ok: false };
  if (!isAnalysisCounts(data.counts)) return { ok: false };
  return {
    ok: true,
    data: {
      version: 1,
      keyObservations: data.keyObservations as ProjectAnalysisCacheData['keyObservations'],
      dynamicSites: data.dynamicSites as ProjectAnalysisCacheData['dynamicSites'],
      missingKeys: data.missingKeys as string[],
      counts: data.counts,
    },
  };
}

function scanProjectAnalysis(ctx: CoreContext): ProjectAnalysisCacheData {
  const scanInput = {
    srcRoot: ctx.paths.srcRoot,
    functions: ctx.config.functions,
    runtime: ctx.adapters,
    exclude: ctx.config.exclude,
  };
  const keyObservations = scanProjectKeyObservations(scanInput);
  const dynamicSites = scanProjectDynamicKeySites(scanInput);
  const usage = literalKeyUsageFromObservations(keyObservations);
  const sourceLeaves = readSourceLocaleLeaves(ctx);
  const missingKeys = computeMissingLiteralKeysFromLeaves(sourceLeaves, usage.resolvedKeys);
  const projectFs = { fs: ctx.adapters.fs, path: ctx.adapters.path };
  const sourceFilesScanned = listSourceFiles(projectFs, ctx.paths.srcRoot, ctx.config.exclude).length;

  return {
    version: 1,
    keyObservations,
    dynamicSites,
    missingKeys,
    counts: {
      keyObservations: keyObservations.length,
      dynamicSites: dynamicSites.length,
      sourceFilesScanned,
      missingKeys: missingKeys.length,
    },
  };
}

function produceProjectAnalysis(
  ctx: CoreContext,
  rebuild?: CacheProducerContext<ProjectAnalysisCacheData>,
): ProjectAnalysisCacheData {
  if (rebuild?.previous !== undefined && rebuild.analysisRebuild?.strategy === 'reuse') {
    return rebuild.previous;
  }
  if (rebuild?.previous !== undefined && rebuild.analysisRebuild?.strategy === 'partial') {
    if (rebuild.analysisRebuild.reason === 'source_locale_partial') {
      return patchProjectAnalysisFromSourceLocaleDelta(ctx, rebuild.previous);
    }
    return patchProjectAnalysisFromSrcDelta(ctx, rebuild.previous, rebuild.classified.src);
  }
  return scanProjectAnalysis(ctx);
}

function withDerivedUsage(data: ProjectAnalysisCacheData, cache?: ProjectAnalysis['cache']): ProjectAnalysis {
  return {
    ...data,
    usage: literalKeyUsageFromObservations(data.keyObservations),
    ...(cache !== undefined ? { cache } : {}),
  };
}

export function resolveProjectAnalysis(ctx: CoreContext, opts: ProjectAnalysisResolveOptions = {}): ProjectAnalysis {
  const cacheCtx = ctx.cache;
  if (cacheCtx === undefined) {
    return withDerivedUsage(scanProjectAnalysis(ctx));
  }

  const rebuildConfig = resolveCacheRebuildConfig(ctx.config.cache);
  const result = getOrBuildCachedProjectData<ProjectAnalysisCacheData>({
    state: cacheCtx.state,
    runtime: cacheCtx.runtime,
    sourceLocalePath: ctx.paths.sourceLocale,
    srcRoot: ctx.paths.srcRoot,
    localesDir: ctx.paths.localesDir,
    locales: ctx.config.locales,
    exclude: ctx.config.exclude,
    rebuildConfig,
    producer: (rebuild) => produceProjectAnalysis(ctx, rebuild),
    parseCachedData: parseProjectAnalysisCacheData,
    baselineFiles: cacheCtx.baselineFiles,
  });
  if (opts.emit !== undefined && opts.op !== undefined) {
    emitCacheDispatchMessages({
      emit: opts.emit,
      op: opts.op,
      runId: opts.runId,
      label: 'project analysis',
      cache: result.cache,
    });
  }
  return withDerivedUsage(result.data, result.cache);
}

export function resolveProjectDynamicSites(ctx: CoreContext, opts: ProjectAnalysisResolveOptions = {}) {
  return resolveProjectAnalysis(ctx, opts).dynamicSites;
}

export function resolveProjectDynamicSitesCount(ctx: CoreContext, opts: ProjectAnalysisResolveOptions = {}) {
  return resolveProjectAnalysis(ctx, opts).counts.dynamicSites;
}

export function resolveProjectResolvedKeys(ctx: CoreContext, opts: ProjectAnalysisResolveOptions = {}) {
  return resolveProjectAnalysis(ctx, opts).usage.resolvedKeys;
}

export function resolveProjectMissingKeys(ctx: CoreContext, opts: ProjectAnalysisResolveOptions = {}) {
  return resolveProjectAnalysis(ctx, opts).missingKeys;
}
