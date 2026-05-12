import type { ReviewRunOptions, RunEmitter } from '@i18nprune/core';

export type ReviewOptions = ReviewRunOptions;
export type ReviewRuntime = { emit?: RunEmitter; runId?: string };
