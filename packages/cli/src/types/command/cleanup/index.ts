export type { CleanupJsonOutput } from '@/types/command/cleanup/json.js';

/** Flags for `i18nprune cleanup`. */
export type CleanupOptions = {
  checkOnly?: boolean;
  /** Do not run ripgrep safety (delete purely from static key analysis; use with care) */
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
