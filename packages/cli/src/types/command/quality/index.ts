import type { QualityRunOptions, RunEmitter } from '@i18nprune/core';

export type QualityOptions = QualityRunOptions;
export type QualityRuntime = { emit?: RunEmitter; runId?: string };
