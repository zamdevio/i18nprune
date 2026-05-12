import type { CliJsonEnvelope, MissingJsonOutput, MissingRunOptions, MissingRunResult, RunEmitter } from '@i18nprune/core';

/** Flags for `i18nprune missing` (scaffold keys into locale JSON). */
export type MissingOptions = MissingRunOptions & {
  /** Max paths / placeholder leaves to show in listings; default 10. Ignored when `full` is true. */
  top?: number;
  /** Output lists every path / placeholder leaf (overrides `top`). */
  full?: boolean;
};

export type MissingRuntime = { emit?: RunEmitter; runId?: string };

export type MissingJsonRunResult = MissingRunResult & {
  envelope: CliJsonEnvelope<'missing', MissingJsonOutput>;
};

export type MissingJsonEnvelopeResult = {
  envelope: CliJsonEnvelope<'missing', MissingJsonOutput>;
  result?: MissingJsonRunResult;
};

export type MissingJsonEnvelopeOptions = {
  applyWrites?: boolean;
};
