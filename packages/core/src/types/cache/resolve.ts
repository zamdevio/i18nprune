import type { CacheProfileId } from './profile.js';
import type { CacheRebuildMode } from './rebuild.js';

/** Raw `cache` block from config (file, init template, or host flag layer). */
export type CacheConfigSource = {
  enabled?: boolean;
  dir?: string;
  profile?: CacheProfileId;
  mode?: 'readWrite' | 'readOnly';
  rebuild?: CacheRebuildMode;
  fullRescanThresholdPercent?: number;
};

/** Fully resolved cache policy after profile expansion and overrides. */
export type ResolvedCacheConfig = {
  enabled: boolean;
  profile: CacheProfileId;
  mode: 'readWrite' | 'readOnly';
  rebuild: CacheRebuildMode;
  fullRescanThresholdPercent: number;
  dir?: string;
};
