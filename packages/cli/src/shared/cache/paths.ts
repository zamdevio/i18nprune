import { initializeCacheState, resolveCacheState } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { buildCliCacheRuntime, defaultCliCacheRootDir } from './runtime.js';
import type { CacheDisableReason, CacheState, CacheWarning, RuntimeAdapters } from '@i18nprune/core';

export function resolveCliCacheState(input: {
  projectRoot: string;
  noCache?: boolean;
  disabledReason?: CacheDisableReason;
  cacheRootDir?: string;
  adapters?: RuntimeAdapters;
}): CacheState {
  const adapters = input.adapters ?? createNodeRuntimeAdapters();
  return resolveCacheState({
    projectRoot: input.projectRoot,
    noCache: input.noCache,
    disabledReason: input.disabledReason,
    cacheRootDir: input.cacheRootDir ?? defaultCliCacheRootDir(),
    runtime: buildCliCacheRuntime(adapters),
  });
}

/** Validates root paths and write access; disables cache gracefully when unavailable. */
export function initializeCliCacheState(input: {
  projectRoot: string;
  noCache?: boolean;
  disabledReason?: CacheDisableReason;
  cacheRootDir?: string;
  adapters?: RuntimeAdapters;
}): {
  state: CacheState;
  warnings: CacheWarning[];
} {
  const adapters = input.adapters ?? createNodeRuntimeAdapters();
  return initializeCacheState({
    projectRoot: input.projectRoot,
    noCache: input.noCache,
    disabledReason: input.disabledReason,
    cacheRootDir: input.cacheRootDir ?? defaultCliCacheRootDir(),
    runtime: buildCliCacheRuntime(adapters),
  });
}
