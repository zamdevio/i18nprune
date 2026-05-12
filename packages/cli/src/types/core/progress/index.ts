import type { TranslationTickProgressOptions } from '@i18nprune/core';

export type ProgressCallbacks = {
  onUpdate?: (line: string) => void;
  onComplete?: () => void;
  onError?: () => void;
};

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

export type SessionProgressOptions = {
  quiet?: boolean;
  json?: boolean;
};

/**
 * Shared per-target execution counters used by `generate` (including `--resume`) and future patching flows.
 * Keep this shape stable so commands can share one JSON contract.
 */
export type TargetProgressSummary = {
  sourceLeafCount?: number;
  processedLeafCount?: number;
  translatedLeafCount?: number;
  updatedLeafCount?: number;
  preserveCount?: number;
  paritySkipCount?: number;
  forced?: boolean;
  durationMs?: number;
  requestAttempts?: number;
  requestRetries?: number;
  requestSuccesses?: number;
  requestFailures?: number;
};
