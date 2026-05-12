import type { MissingRunOptions, RunEmitter } from '@i18nprune/core';

export type { MissingJsonOutput, MissingRunOptions } from '@i18nprune/core';

/** Flags for `i18nprune missing` (scaffold keys into locale JSON). */
export type MissingOptions = MissingRunOptions & {
  /** Max paths to show in human listings; default 10. Ignored when `full` is true. */
  top?: number;
  /** Human output lists every path (overrides `top`). `--json` still emits full `paths`. */
  full?: boolean;
};

export type MissingRuntime = { emit?: RunEmitter; runId?: string };
