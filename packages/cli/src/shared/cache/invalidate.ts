import {
  invalidateProjectAnalysisCacheAfterLocaleWrites,
  resolveCacheRebuildConfig,
  type AnalysisCacheInvalidationDecision,
} from '@i18nprune/core';
import { buildCliCacheRuntime } from './runtime.js';
import { logger } from '@/utils/logger/index.js';
import type { Context } from '@/types/core/context/index.js';

function localeSegmentKey(ctx: Context, absolutePath: string): string {
  return ctx.adapters.path.relative(ctx.paths.localesDir, absolutePath).replace(/\\/g, '/');
}

function sourceLocaleSegmentKey(ctx: Context): string {
  return localeSegmentKey(ctx, ctx.paths.sourceLocale);
}

function describeInvalidationDetail(decision: AnalysisCacheInvalidationDecision): string | undefined {
  if (decision.action === 'delete') {
    return decision.reason === 'config_rebuild_full'
      ? '  analysis invalidation: deleted (config rebuild=full)'
      : '  analysis invalidation: deleted';
  }
  if (decision.reason === 'target_locale_writes_only') {
    return '  analysis invalidation: skipped (target locale writes only)';
  }
  if (decision.reason === 'locale_writes_dispatch_handles') {
    return '  analysis invalidation: skipped (dispatch rebuild on next run)';
  }
  return undefined;
}

/**
 * Apply post-mutation analysis cache policy after sync/generate locale writes.
 * Skips delete when core dispatch can reuse or patch on the next command.
 */
export function invalidateProjectAnalysisCacheForContext(
  ctx: Context,
  input: { writtenLocalePaths: readonly string[] },
): void {
  if (!ctx.meta.cache.enabled) return;

  const mutatedLocaleSegmentKeys = input.writtenLocalePaths.map((path) => localeSegmentKey(ctx, path));
  const decision = invalidateProjectAnalysisCacheAfterLocaleWrites(
    ctx.meta.cache,
    buildCliCacheRuntime(ctx.adapters),
    {
      enabled: ctx.meta.cache.enabled,
      rebuildConfig: resolveCacheRebuildConfig(ctx.config.cache),
      sourceLocaleSegmentKey: sourceLocaleSegmentKey(ctx),
      mutatedLocaleSegmentKeys,
    },
  );

  const detail = describeInvalidationDetail(decision);
  if (detail !== undefined) {
    logger.cacheDetail(detail, ctx.run);
  }
}
