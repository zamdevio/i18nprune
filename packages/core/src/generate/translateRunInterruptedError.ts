/** Stats captured when translation stops before all planned leaves finished (provider retry resume). */
export type TranslateRunPartialStats = {
  readonly requestAttempts: number;
  readonly retriesMade: number;
  readonly successfulLeaves: number;
  readonly failedRequests: number;
};

/**
 * Thrown when **`translateLeaf`** fails mid-run while **`generate`** / **`fill`** already committed
 * earlier leaf updates into **`partialLocaleJson`**. Host may retry with another provider using that
 * snapshot so completed paths are not re-translated.
 */
export class TranslateRunInterruptedError extends Error {
  override readonly name = 'TranslateRunInterruptedError';

  readonly partialLocaleJson: unknown;

  readonly translateStats: TranslateRunPartialStats;

  constructor(init: {
    /** Usually the backend rejection that stopped the pool / serial loop. */
    cause: unknown;
    partialLocaleJson: unknown;
    translateStats: TranslateRunPartialStats;
    message?: string;
  }) {
    super(init.message ?? 'Translation interrupted before completion', { cause: init.cause });
    this.partialLocaleJson = init.partialLocaleJson;
    this.translateStats = init.translateStats;
  }
}
