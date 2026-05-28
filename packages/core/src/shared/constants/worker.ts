/** Worker ingest query key for dedup override on upload/archive routes. */
export const WORKER_INGEST_FORCE_QUERY = 'force' as const;

/** Idle-retention TTL for hosted worker metadata rows (7 days). */
export const WORKER_IDLE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
