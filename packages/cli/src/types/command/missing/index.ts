import type { CliJsonEnvelope, MissingJsonOutput, MissingRunOptions, MissingRunResult, RunEmitter } from '@i18nprune/core';

/** Flags for `i18nprune missing` (scaffold keys into locale JSON). List caps use global `--top` / `--full`. */
export type MissingOptions = MissingRunOptions;

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
