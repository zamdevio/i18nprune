import type { TranslateRunPartialStats } from '../../types/translator/runStats.js';

/**
 * Thrown when **`translateLeaf`** fails mid-run while the translator pool / serial loop has already
 * committed earlier leaf updates into **`partialLocaleJson`**. Callers (currently **`runGenerate`** and
 * **`fill`**) catch this so a fallback provider can resume without re-translating completed paths.
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
