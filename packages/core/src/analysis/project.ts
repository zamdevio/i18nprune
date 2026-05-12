import { scanProjectDynamicKeySites } from '../extractor/dynamic/orchestrate.js';
import { scanProjectKeyObservations } from '../extractor/keySites/orchestrate.js';
import { literalKeyUsageFromObservations } from '../extractor/keySites/projectUsage.js';
import { emitCacheDispatchMessages, getOrBuildCachedProjectData } from '../cache/index.js';
import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';
import type { KeyObservation } from '../types/extractor/keySites/index.js';
import type { ProjectLiteralKeyUsage } from '../extractor/projectLiteralKeyUsage.js';
import type { CacheDispatchInfo } from '../types/cache/index.js';
import type { CoreContext } from '../types/generate/index.js';
import type { OperationId, RunEmitter } from '../types/shared/run/index.js';

const PROJECT_ANALYSIS_CACHE_KEY = 'project-analysis-v1';

export type ProjectAnalysisCacheData = {
  version: 1;
  keyObservations: KeyObservation[];
  dynamicSites: DynamicKeySite[];
};

export type ProjectAnalysis = ProjectAnalysisCacheData & {
  usage: ProjectLiteralKeyUsage;
  cache?: CacheDispatchInfo;
};

export type ProjectAnalysisResolveOptions = {
  emit?: RunEmitter;
  op?: OperationId;
  runId?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseProjectAnalysisCacheData(data: unknown): { ok: true; data: ProjectAnalysisCacheData } | { ok: false } {
  if (!isRecord(data)) return { ok: false };
  if (data.version !== 1) return { ok: false };
  if (!Array.isArray(data.keyObservations) || !Array.isArray(data.dynamicSites)) return { ok: false };
  return {
    ok: true,
    data: {
      version: 1,
      keyObservations: data.keyObservations as KeyObservation[],
      dynamicSites: data.dynamicSites as DynamicKeySite[],
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
  return {
    version: 1,
    keyObservations: scanProjectKeyObservations(scanInput),
    dynamicSites: scanProjectDynamicKeySites(scanInput),
  };
}

function withDerivedUsage(data: ProjectAnalysisCacheData, cache?: CacheDispatchInfo): ProjectAnalysis {
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

  const result = getOrBuildCachedProjectData<ProjectAnalysisCacheData>({
    cacheKey: PROJECT_ANALYSIS_CACHE_KEY,
    state: cacheCtx.state,
    runtime: cacheCtx.runtime,
    sourceLocalePath: ctx.paths.sourceLocale,
    srcRoot: ctx.paths.srcRoot,
    exclude: ctx.config.exclude,
    producer: () => scanProjectAnalysis(ctx),
    parseCachedData: parseProjectAnalysisCacheData,
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

export function resolveProjectDynamicSites(ctx: CoreContext, opts: ProjectAnalysisResolveOptions = {}): DynamicKeySite[] {
  return resolveProjectAnalysis(ctx, opts).dynamicSites;
}

export function resolveProjectDynamicSitesCount(ctx: CoreContext, opts: ProjectAnalysisResolveOptions = {}): number {
  return resolveProjectAnalysis(ctx, opts).dynamicSites.length;
}

export function resolveProjectResolvedKeys(ctx: CoreContext, opts: ProjectAnalysisResolveOptions = {}): ReadonlySet<string> {
  return resolveProjectAnalysis(ctx, opts).usage.resolvedKeys;
}
