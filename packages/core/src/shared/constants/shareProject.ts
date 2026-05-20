/**
 * Limits for prepared project snapshots uploaded to the share worker.
 * Keep aligned with `apps/workers/i18nprune` `PROJECT_LIMITS`.
 */
export const SHARE_PROJECT_SNAPSHOT_MAX_ZIP_BYTES = 50 * 1024 * 1024;
export const SHARE_PROJECT_SNAPSHOT_MAX_FILES = 15_000;
export const SHARE_PROJECT_SNAPSHOT_MAX_TEXT_BYTES = 60 * 1024 * 1024;
