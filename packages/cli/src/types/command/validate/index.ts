import type { CliJsonEnvelope, DynamicKeySite, KeyObservation, RuntimeAdapters, RunEmitter } from '@i18nprune/core';

import type { ValidateJsonOutput } from '@/types/command/validate/json.js';

/** Flags for `i18nprune validate` (literal keys vs source JSON). */
export type ValidateOptions = Record<string, never>;

export type { ValidateJsonOutput };

export type ValidateRuntime = { emit?: RunEmitter; runId?: string; adapters?: RuntimeAdapters };

export type ValidateJsonRunResult = {
  envelope: CliJsonEnvelope<'validate', ValidateJsonOutput>;
  fullDynamicSites: DynamicKeySite[];
  fullKeyObservations: KeyObservation[];
};
