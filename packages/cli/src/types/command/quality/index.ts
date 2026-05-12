import type { RunEmitter } from '@i18nprune/core';

export type { QualityRunOptions as QualityOptions } from '@i18nprune/core';

export type QualityRuntime = { emit?: RunEmitter; runId?: string };
