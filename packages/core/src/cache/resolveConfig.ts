import { CACHE_PROFILE_DEFAULTS, DEFAULT_CACHE_PROFILE_ID } from '../shared/constants/cache.js';
import type { CacheConfigSource, ResolvedCacheConfig } from '../types/cache/resolve.js';
import type { CacheRebuildConfig } from '../types/cache/rebuild.js';

export type { CacheConfigSource, ResolvedCacheConfig } from '../types/cache/resolve.js';

function clampThresholdPercent(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * Resolve `cache.*` for runtime: apply {@link CACHE_PROFILE_DEFAULTS}, then let any
 * explicitly set field override the profile (undefined = use profile value).
 */
export function resolveCacheConfig(cache?: CacheConfigSource): ResolvedCacheConfig {
  const profileId = cache?.profile ?? DEFAULT_CACHE_PROFILE_ID;
  const profile = CACHE_PROFILE_DEFAULTS[profileId] ?? CACHE_PROFILE_DEFAULTS[DEFAULT_CACHE_PROFILE_ID];
  const threshold =
    cache?.fullRescanThresholdPercent !== undefined
      ? clampThresholdPercent(cache.fullRescanThresholdPercent)
      : profile.fullRescanThresholdPercent;

  return {
    enabled: cache?.enabled ?? true,
    profile: profileId,
    mode: cache?.mode ?? profile.mode,
    rebuild: cache?.rebuild ?? profile.rebuild,
    fullRescanThresholdPercent: threshold,
    ...(cache?.dir !== undefined ? { dir: cache.dir } : {}),
  };
}

/** Analysis rebuild slice of {@link resolveCacheConfig}. */
export function resolveCacheRebuildConfig(cache?: CacheConfigSource): CacheRebuildConfig {
  const resolved = resolveCacheConfig(cache);
  return {
    rebuild: resolved.rebuild,
    fullRescanThresholdPercent: resolved.fullRescanThresholdPercent,
  };
}
