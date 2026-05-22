/** Fraction of cached project+report rows to delete on confirmed storage pressure. */
export const STORAGE_PRESSURE_EVICTION_FRACTION = 0.25;

/** Same normalized storage error signature must repeat this many times before eviction runs. */
export const STORAGE_PRESSURE_FAILURE_THRESHOLD = 10;

/** Ring buffer size for recent storage failure signatures (`ops:storage:ring`). */
export const STORAGE_PRESSURE_RING_MAX = 10;
