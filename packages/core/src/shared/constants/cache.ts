/** Envelope version stamped into every on-disk cache JSON file. */
export const CACHE_SCHEMA_VERSION = 1 as const;

/** Current on-disk basenames for project cache slots (used by `paths.ts` for resolution). */
export const SNAPSHOT_BASENAME = 'snapshot.json';
export const ANALYSIS_BASENAME = 'analysis.json';

/** Pre-rename basenames: read on cache load as a migration fallback, then overwritten on save. */
export const LEGACY_SNAPSHOT_BASENAME = 'run.json';
export const LEGACY_ANALYSIS_BASENAME = 'project-analysis-v1.json';

/** `cacheKey` value that routes a dispatch to the analysis slot (`analysis.json`). */
export const ANALYSIS_CACHE_KEY = 'analysis';

/** Size guard for the global `meta.json` projects index. */
export const MAX_PROJECTS_INDEX_BYTES = 2 * 1024 * 1024; // 2 MiB
/** Size guard for a project's `files.json` file-record map. */
export const MAX_PROJECT_FILES_BYTES = 32 * 1024 * 1024; // 32 MiB
/** Size guard for a project's `snapshot.json` or `analysis.json` run envelope. */
export const MAX_SNAPSHOT_BYTES = 16 * 1024 * 1024; // 16 MiB

/** How many runs between automatic self-heal sweeps of the meta index. */
export const DEFAULT_HEAL_EVERY_RUNS = 20;
