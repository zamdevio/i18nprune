import type {
  CleanupJsonOutput,
  CleanupRunOptions,
  CleanupRunResult,
  CliJsonEnvelope,
  RunEmitter,
} from '@i18nprune/core';

export type { CleanupJsonOutput } from '@i18nprune/core';

/** Flags for `i18nprune cleanup`. */
export type CleanupOptions = CleanupRunOptions & {
  /** Enable ripgrep string-presence guard (opt-in; static scan is default). */
  rg?: boolean;
  /**
   * Interactive TTY only: confirm removals in batches (grouped by top-level namespace).
   * Ignored when global **`--yes`** is set, with **`--json`**, or without a TTY.
   */
  ask?: boolean;
  /**
   * Confirm each unused key path separately (no namespace batches).
   * Ignored when **`--yes`** is set. Overrides **`--ask`** when both are passed.
   */
  askPerKey?: boolean;
};

export type CleanupRuntime = {
  emit?: RunEmitter;
  runId?: string;
  listLimit?: number;
  listFull?: boolean;
};

export type CleanupJsonRunResult = CleanupRunResult & {
  envelope: CliJsonEnvelope<'cleanup', CleanupJsonOutput>;
};

export type CleanupJsonEnvelopeResult = {
  envelope: CliJsonEnvelope<'cleanup', CleanupJsonOutput>;
  result?: CleanupJsonRunResult;
};
