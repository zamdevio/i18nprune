import type { CliJsonEnvelope, ReviewJsonData, ReviewRunResult, RunEmitter } from '@i18nprune/core';

export type ReviewRuntime = { emit?: RunEmitter; runId?: string };

export type ReviewJsonRunResult = ReviewRunResult & {
  envelope: CliJsonEnvelope<'review', ReviewJsonData>;
};

export type ReviewJsonEnvelopeResult = {
  envelope: CliJsonEnvelope<'review', ReviewJsonData>;
  result?: ReviewJsonRunResult;
};
