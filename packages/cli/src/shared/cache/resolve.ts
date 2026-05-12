import { extractor } from '@i18nprune/core';
import { resolveProjectReportData } from './reportData.js';
import { toExtractorScanInput } from '@/shared/extractor/index.js';
import type { Context } from '@/types/core/context/index.js';

export function resolveCachedProjectReportDocument(ctx: Context) {
  return resolveProjectReportData(ctx).document;
}

export function resolveLocalesDynamicSites(ctx: Context): ReturnType<typeof extractor.dynamic.scanProjectDynamicKeySites> {
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    return doc.details.dynamicSites as ReturnType<typeof extractor.dynamic.scanProjectDynamicKeySites>;
  } catch {
    return extractor.dynamic.scanProjectDynamicKeySites({
      srcRoot: ctx.paths.srcRoot,
      functions: ctx.config.functions,
      runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path, system: ctx.adapters.system },
      exclude: ctx.config.exclude,
    });
  }
}

export function resolveDynamicSitesCount(ctx: Context): number {
  return resolveLocalesDynamicSites(ctx).length;
}

export function resolveKeyObservationsCount(ctx: Context): number {
  try {
    const doc = resolveCachedProjectReportDocument(ctx);
    const obs = doc.details.keyObservations;
    return Array.isArray(obs) ? obs.length : 0;
  } catch {
    return extractor.keySites.scanProjectKeyObservations(toExtractorScanInput(ctx)).length;
  }
}

/** Human summaries: align with **`validate`** (`dynamic`, `keyObservations`). */
export function resolveExtractionBaselineCounts(ctx: Context): {
  dynamic: number;
  keyObservations: number;
} {
  return { dynamic: resolveDynamicSitesCount(ctx), keyObservations: resolveKeyObservationsCount(ctx) };
}

