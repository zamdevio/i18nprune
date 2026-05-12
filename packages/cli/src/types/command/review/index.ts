import type { RunEmitter } from '@i18nprune/core';

export type { ReviewRunOptions as ReviewOptions } from '@i18nprune/core';

export type ReviewRuntime = { emit?: RunEmitter; runId?: string };
