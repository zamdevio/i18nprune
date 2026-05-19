import type { CacheProfileDefaults, CacheProfileId } from '../../types/cache/profile.js';

/** Envelope version stamped into every on-disk cache JSON file. */
export const CACHE_SCHEMA_VERSION = 1 as const;

/** Default `cache.profile` when omitted (balanced). */
export const DEFAULT_CACHE_PROFILE_ID: CacheProfileId = 'balanced';

/** Locked profile bundles — keep in sync with docs/cli/cache.md. */
export const CACHE_PROFILE_DEFAULTS: Record<CacheProfileId, CacheProfileDefaults> = {
  safe: {
    rebuild: 'full',
    fullRescanThresholdPercent: 10,
    mode: 'readWrite',
  },
  balanced: {
    rebuild: 'partial',
    fullRescanThresholdPercent: 40,
    mode: 'readWrite',
  },
  fast: {
    rebuild: 'partial',
    fullRescanThresholdPercent: 70,
    mode: 'readWrite',
  },
};

/** On-disk project scan cache (`analysis.json`). */
export const ANALYSIS_BASENAME = 'analysis.json';
/** Per-target translation cache directory (`translations/<code>.json`). */
export const TRANSLATIONS_DIR = 'translations';

/** Size guard for the global `meta.json` projects index. */
export const MAX_PROJECTS_INDEX_BYTES = 2 * 1024 * 1024; // 2 MiB
/** Size guard for a project's `files.json` file-record map. */
export const MAX_PROJECT_FILES_BYTES = 32 * 1024 * 1024; // 32 MiB
/** Size guard for a project's `analysis.json` run envelope. */
export const MAX_ANALYSIS_BYTES = 16 * 1024 * 1024; // 16 MiB
/** Size guard for a project's per-locale `translations/<code>.json` file. */
export const MAX_TRANSLATIONS_CACHE_BYTES = 32 * 1024 * 1024; // 32 MiB

/** How many runs between automatic self-heal sweeps of the meta index. */
export const DEFAULT_HEAL_EVERY_RUNS = 20;
