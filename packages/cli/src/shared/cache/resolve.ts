import { resolveProjectAnalysis } from '@i18nprune/core';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import type { Context } from '@/types/core/context/index.js';

export function resolveProjectAnalysisFromContext(ctx: Context) {
  return resolveProjectAnalysis(createCliCoreContext(ctx));
}

export function resolveDynamicSitesCount(ctx: Context): number {
  return resolveProjectAnalysisFromContext(ctx).counts.dynamicSites;
}

/** Human summaries: align with **`validate`** (`dynamic`, `keyObservations`). */
export function resolveExtractionBaselineCounts(ctx: Context): {
  dynamic: number;
  keyObservations: number;
} {
  const { counts } = resolveProjectAnalysisFromContext(ctx);
  return { dynamic: counts.dynamicSites, keyObservations: counts.keyObservations };
}
