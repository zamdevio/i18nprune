/**
 * Row count for **`rawUp`** / **`up`** post-progress reclaim — **clamped 1…8** in **`rawUp`**.
 */
export type LiftRows = number;

/**
 * Rows in a multi-line stderr block (progress frame, etc.). **Not** clamped like {@link LiftRows}.
 */
export type LineCount = number;
