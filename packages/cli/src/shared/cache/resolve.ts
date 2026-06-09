import { resolveProjectAnalysis } from '@i18nprune/core';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import type { Context } from '@/types/core/context/index.js';

export function resolveProjectAnalysisFromContext(ctx: Context) {
  return resolveProjectAnalysis(createCliCoreContext(ctx));
}

export function resolveDynamicSitesCount(ctx: Context): number {
  return resolveProjectAnalysisFromContext(ctx).counts.dynamicActive;
}

/** Human summaries: align with **`validate`** (`dynamic`, `keyObservations`). */
export function resolveExtractionBaselineCounts(ctx: Context): {
  dynamic: number;
  commented?: number;
  keyObservations: number;
} {
  const { counts } = resolveProjectAnalysisFromContext(ctx);
  const out: { dynamic: number; commented?: number; keyObservations: number } = {
    dynamic: counts.dynamicActive,
    keyObservations: counts.keyObservations,
  };
  if (counts.dynamicCommented > 0) out.commented = counts.dynamicCommented;
  return out;
}
