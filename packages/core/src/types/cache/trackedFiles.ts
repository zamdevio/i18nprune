import type { CachedLocalesLayout } from './localesLayout.js';
import type { CacheProjectFileRecord } from './projectFileRecord.js';

/** Current tracked src + locale segment maps and layout fingerprint for one scan. */
export type TrackedProjectFilesCurrent = {
  files: Record<string, CacheProjectFileRecord>;
  localeSegments: Record<string, CacheProjectFileRecord>;
  localesLayout: CachedLocalesLayout;
  merged: Record<string, CacheProjectFileRecord>;
};
