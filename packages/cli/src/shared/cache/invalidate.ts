import { invalidateProjectAnalysisCache } from '@i18nprune/core';
import { buildCliCacheRuntime } from './runtime.js';
import type { Context } from '@/types/core/context/index.js';

/** Drop `analysis.json` after locale mutations so the next command rescans. */
export function invalidateProjectAnalysisCacheForContext(ctx: Context): void {
  if (!ctx.meta.cache.enabled) return;
  invalidateProjectAnalysisCache(ctx.meta.cache, buildCliCacheRuntime(ctx.adapters));
}
