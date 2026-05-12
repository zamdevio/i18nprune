import type { DynamicKeySite, KeyObservation } from '../extractor/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { LocaleMetadataReport } from '../localeLeaves/index.js';
import type { SyncProgressEvent } from '../shared/run/index.js';
import type { SyncHumanLeafSummary } from '../../sync/humanLeafSummary.js';
import type { RunEmitter } from '../shared/run/index.js';

export type SyncFileLine = { path: string; changed: boolean };

/**
 * Payload shape for `i18nprune sync --json`.
 * Additive fields may appear in future versions.
 */
export type SyncJsonOutput = {
  kind: 'sync';
  sourcePath: string;
  localesDir: string;
  targetFiles: number;
  writtenFiles: number;
  dynamicKeySites: number;
  dryRun: boolean;
  files: SyncFileLine[];
  localeMetadataReports?: Record<string, LocaleMetadataReport>;
};

export type SyncRunOptions = {
  /** Report only; do not write locale files. */
  dryRun?: boolean;
  /** Comma-separated locale basenames, or `all` (default: all non-source locales). */
  target?: string;
  /** Write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`). */
  metadata?: boolean;
  /** Force reset structured leaf metadata to plain string values. */
  stripMetadata?: boolean;
};

export type SyncReferenceData = {
  keyObservations: readonly KeyObservation[];
  dynamicSites: readonly DynamicKeySite[];
};

export type SyncHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  emitProgress: (
    e: Omit<Extract<SyncProgressEvent, { type: 'run.progress.sync' }>, 'op' | 'runId' | 'at'>,
  ) => void;
  loadReferenceData: () => SyncReferenceData;
};

export type SyncRunResult = {
  payload: SyncJsonOutput;
  issues: Issue[];
  fileLines: SyncFileLine[];
  targets: string[];
  updated: number;
  dynamicSites: DynamicKeySite[];
  /** Requested locale codes with no matching file under `localesDir` (human-mode warning). */
  missingLocaleCodes: string[];
  /** Per-locale leaf stats for human stderr (not part of `--json`). */
  humanLeafSummaryByLocaleFile: Record<string, SyncHumanLeafSummary>;
};
