import { createCoreContext, type CoreContext } from '@i18nprune/core';
import { buildCliCacheRuntime } from '@/shared/cache/runtime.js';
import type { Context } from '@/types/core/context/index.js';

export function createCliCoreContext(ctx: Context, signal?: AbortSignal): CoreContext {
  return createCoreContext({
    config: ctx.config,
    adapters: ctx.adapters,
    env: process.env,
    paths: ctx.paths,
    configFileLoaded: ctx.meta.configFileLoaded,
    run: ctx.run,
    ...(signal !== undefined ? { signal } : {}),
    cache: {
      state: ctx.meta.cache,
      runtime: buildCliCacheRuntime(ctx.adapters),
      baselineFiles: ctx.meta.cacheBaselineFiles,
    },
  });
}
