import type { TranslationTickProgressOptions } from '@i18nprune/core';

export type TranslationProgress = {
  readonly quiet: boolean;
  tick(
    current: number,
    total: number,
    label: string,
    options?: TranslationTickProgressOptions,
  ): void;
  /**
   * Freeze updates (heartbeat / ticks when `promptOpen`).
   * Use **`clearBar: false`** to keep the last frame visible under an stderr **`confirm`** dialog.
   * No-op for quiet / JSON progress sinks.
   */
  pauseClock?(opts?: { clearBar?: boolean }): void;
  /** Resume timing after {@link pauseClock} (idempotent). */
  resumeClock?(): void;
  done(): void;
  fail(): void;
};
