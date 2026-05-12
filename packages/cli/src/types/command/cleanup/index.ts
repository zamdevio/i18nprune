import type { CleanupRunOptions, RunEmitter } from '@i18nprune/core';

export type { CleanupJsonOutput } from '@i18nprune/core';

/** Flags for `i18nprune cleanup`. */
export type CleanupOptions = CleanupRunOptions & {
  /** CLI spelling for skipping the host string-presence probe. */
  skipRg?: boolean;
  /**
   * Interactive TTY only: confirm removals in batches (grouped by top-level namespace).
   * Ignored when global **`--yes`** is set, with **`--json`**, or without a TTY.
   */
  ask?: boolean;
  /**
   * With **`ask`**: confirm each key separately instead of namespace batches.
   * Ignored when **`--yes`** is set.
   */
  askPerKey?: boolean;
};

export type CleanupRuntime = { emit?: RunEmitter; runId?: string };
