import type { CliJsonEnvelope, QualityJsonData, QualityRunOptions, QualityRunResult, RunEmitter } from '@i18nprune/core';

export type QualityOptions = QualityRunOptions;
export type QualityRuntime = { emit?: RunEmitter; runId?: string };

export type QualityJsonRunResult = QualityRunResult & {
  envelope: CliJsonEnvelope<'quality', QualityJsonData>;
};

export type QualityJsonEnvelopeResult = {
  envelope: CliJsonEnvelope<'quality', QualityJsonData>;
  result?: QualityJsonRunResult;
};
