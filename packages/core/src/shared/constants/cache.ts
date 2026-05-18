/** Envelope version stamped into every on-disk cache JSON file. */
export const CACHE_SCHEMA_VERSION = 1 as const;

/** On-disk project scan cache (`analysis.json`). */
export const ANALYSIS_BASENAME = 'analysis.json';

/** Size guard for the global `meta.json` projects index. */
export const MAX_PROJECTS_INDEX_BYTES = 2 * 1024 * 1024; // 2 MiB
/** Size guard for a project's `files.json` file-record map. */
export const MAX_PROJECT_FILES_BYTES = 32 * 1024 * 1024; // 32 MiB
/** Size guard for a project's `analysis.json` run envelope. */
export const MAX_ANALYSIS_BYTES = 16 * 1024 * 1024; // 16 MiB

/** How many runs between automatic self-heal sweeps of the meta index. */
export const DEFAULT_HEAL_EVERY_RUNS = 20;
