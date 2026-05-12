import type { RunEmitter } from '@i18nprune/core';

export type SyncOptions = {
  /** Report only; do not write locale files */
  dryRun?: boolean;
  /** Comma-separated locale basenames, or **`all`** (default: all non-source locales). */
  target?: string;
  /** Write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`). */
  metadata?: boolean;
  /** Force reset structured leaf metadata to plain string values. */
  stripMetadata?: boolean;
};

export type SyncRuntime = { emit?: RunEmitter; runId?: string };
