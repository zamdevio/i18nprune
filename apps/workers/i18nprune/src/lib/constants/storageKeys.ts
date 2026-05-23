/** Durable Object key prefixes (only `project*` / `report*` rows are evicted under storage pressure). */
export const DO_PREFIX_PROJECT = 'project:';
export const DO_PREFIX_PROJECT_HASH = 'projecthash:';
export const DO_PREFIX_REPORT = 'report:';
export const DO_PREFIX_REPORT_HASH = 'reporthash:';

/** Preserved under storage-pressure eviction. */
export const DO_PREFIX_RATE_LIMIT = 'ratelimit:';
export const DO_PREFIX_OPS = 'ops:';

export const OPS_STORAGE_RING_KEY = `${DO_PREFIX_OPS}storage:ring`;
