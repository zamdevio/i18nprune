/** Inactive project rows are purged from Durable Object storage after this idle period. */
export const PROJECT_CACHE_IDLE_MS = 7 * 24 * 60 * 60 * 1000;

/** How often the DO runs a sweep to delete rows past {@link PROJECT_CACHE_IDLE_MS}. */
export const PROJECT_CACHE_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
