import type { DynamicKeySite } from '../extractor/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { LocaleMetadataReport } from '../locales/leaves/index.js';
import type { SyncProgressEvent } from '../shared/run/index.js';
import type { SyncHumanLeafSummary } from '../../sync/humanLeafSummary.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { LocalePlaceholderLeaf, SourcePlaceholderLeaf } from '../../shared/sourcePlaceholders/index.js';

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

export type SyncHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  emitProgress: (
    e: Omit<Extract<SyncProgressEvent, { type: 'run.progress.sync' }>, 'op' | 'runId' | 'at'>,
  ) => void;
  /**
   * Max distinct locale codes to compute human leaf summaries for (merge/prune still runs for all targets).
   * `0` skips summaries; omit for all locales.
   */
  humanSummaryLocaleLimit?: number;
};

export type SyncRunResult = {
  payload: SyncJsonOutput;
  issues: Issue[];
  fileLines: SyncFileLine[];
  targets: string[];
  updated: number;
  dynamicSites: DynamicKeySite[];
  keyObservationsCount: number;
  /** Requested locale codes with no matching file under `localesDir` (human-mode warning). */
  missingLocaleCodes: string[];
  /** Per-locale leaf stats for human stderr (not part of `--json`). */
  humanLeafSummaryByLocaleFile: Record<string, SyncHumanLeafSummary>;
  /** Source placeholder leaves skipped to avoid copying scaffold sentinels into target locales. */
  sourcePlaceholderLeaves: SourcePlaceholderLeaf[];
  /** Target placeholder leaves observed before sync applies its source-shape plan. */
  targetPlaceholderLeaves: LocalePlaceholderLeaf[];
};
