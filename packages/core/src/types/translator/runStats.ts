/**
 * Stats captured when translation stops before all planned leaves finished — surfaced on
 * **`TranslateRunInterruptedError`** so a fallback provider can resume without re-translating
 * already-completed leaves.
 */
export type TranslateRunPartialStats = {
  readonly requestAttempts: number;
  readonly retriesMade: number;
  readonly successfulLeaves: number;
  readonly failedRequests: number;
  /** Leaves served from L1 or L2 without a provider network call. */
  readonly cacheHits: number;
};
