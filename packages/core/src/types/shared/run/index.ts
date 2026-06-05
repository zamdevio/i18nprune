import type { Issue } from '../../json/envelope/index.js';
import type { TranslationProviderId } from '../../translator/providers.js';
import type { ShareLinks } from '../../../types/share/entry.js';
import type { ShareManifest } from '../../../types/share/manifest.js';

/**
 * Known operation identifiers for `run.*` events.
 *
 * Note: this is intentionally small while the event contract is being threaded
 * through operations. Expand as each operation adopts `run.*`.
 */
export type OperationId =
  | 'generate'
  | 'sync'
  | 'validate'
  | 'quality'
  | 'doctor'
  | 'report'
  | 'review'
  | 'missing'
  | 'cleanup'
  | 'locales-dynamic'
  | 'share';

export type RunEventBase = {
  /** Operation identifier (matches `CliJsonEnvelope.kind`). */
  op: OperationId;
  /** Optional run correlation id (host-provided). */
  runId?: string;
};

export type RunStartedEvent = RunEventBase & {
  type: 'run.started';
  at: number;
};

export type GenerateCounts = {
  targets: number;
  leaves: number;
  dynamicKeySites: number;
};

export type SyncCounts = {
  targets: number;
  written: number;
  dynamicKeySites: number;
};

export type ValidateCounts = {
  missing: number;
  dynamic: number;
  keyObservations: number;
};

export type QualityCounts = {
  total: number;
  dynamicKeySites: number;
};

export type DoctorCounts = {
  findings: number;
};

export type ReportCounts = {
  filesScanned?: number;
  missing?: number;
  dynamic?: number;
  keyObservations?: number;
};

export type ReviewCounts = {
  locales: number;
  dynamicKeySites: number;
};

export type MissingCounts = {
  pathsAdded: number;
  targets?: number;
  skippedTargets?: number;
};

export type CleanupCounts = {
  wouldRemove: number;
  dynamic: number;
};

export type LocalesDynamicCounts = {
  dynamicKeySites: number;
  shown: number;
};

export type ShareCounts = {
  fileCount: number;
  zipBytes: number;
};

export type RunCountsByOperation = {
  generate: GenerateCounts;
  sync: SyncCounts;
  validate: ValidateCounts;
  quality: QualityCounts;
  doctor: DoctorCounts;
  report: ReportCounts;
  review: ReviewCounts;
  missing: MissingCounts;
  cleanup: CleanupCounts;
  'locales-dynamic': LocalesDynamicCounts;
  share: ShareCounts;
};

type RunCompletedEventFor<T extends OperationId> = Omit<RunEventBase, 'op'> & {
  op: T;
  type: 'run.completed';
  at: number;
  ok: boolean;
};

export type RunCompletedEvent = {
  [K in OperationId]: RunCompletedEventFor<K>;
}[OperationId];

export type RunFailedEvent = RunEventBase & {
  type: 'run.failed';
  at: number;
  error: {
    /** Stable-ish error identifier for clients (not necessarily an issue code). */
    name: string;
    message: string;
    recoverable: false;
  };
};

export type RunWarningEvent = RunEventBase & {
  type: 'run.warning';
  at: number;
  issue: Issue;
};

export type RunErrorEvent = RunEventBase & {
  type: 'run.error';
  at: number;
  issue: Issue;
  /** When true, operation may continue and still complete successfully. */
  recoverable: boolean;
};

export type RunMessageLevel = 'detail' | 'info' | 'notice' | 'tip' | 'warn';
export type RunMessageChannel = 'default' | 'cache' | 'verbose';

export type RunMessageEvent = RunEventBase & {
  type: 'run.message';
  at: number;
  level: RunMessageLevel;
  channel?: RunMessageChannel;
  message: string;
  target?: string;
  path?: string;
  data?: Record<string, string | number | boolean | null>;
};

export type RunShareManifestEvent = RunEventBase & {
  op: 'share';
  type: 'run.share.manifest';
  at: number;
  manifest: ShareManifest;
};

export type RunShareSkippedEvent = RunEventBase & {
  op: 'share';
  type: 'run.share.skipped';
  at: number;
  reason: string;
  links: ShareLinks;
  workerIds: { projectId?: string; reportId?: string };
};

export type RunShareUploadedEvent = RunEventBase & {
  op: 'share';
  type: 'run.share.uploaded';
  at: number;
  kind: 'project' | 'report';
  workerProjectId?: string;
  workerReportId?: string;
  byteSize: number;
};

export type RunShareLinksEvent = RunEventBase & {
  op: 'share';
  type: 'run.share.links';
  at: number;
  links: ShareLinks;
};

export type ProgressEvent<T extends OperationId> = RunEventBase & {
  type: `run.progress.${T}`;
  at: number;
  current?: number;
  total?: number;
  label?: string;
};
/** Not all operations emit progress events; only ones with meaningful streaming progress should. */

export type GeneratePhase =
  | 'scan_dynamic_sites'
  | 'read_source'
  | 'resolve_targets'
  | 'build_target'
  | 'translate'
  | 'write_files'
  | 'done';

export type SyncPhase =
  | 'scan_dynamic_sites'
  | 'read_source'
  | 'resolve_targets'
  | 'build_target'
  | 'merge'
  | 'prune'
  | 'write_files'
  | 'done';

export type ValidatePhase =
  | 'scan_sources'
  | 'extract_keys'
  | 'read_source'
  | 'compare'
  | 'done';

/** Per-operation progress payloads. */
export type GenerateProgressEvent = ProgressEvent<'generate'> & {
  target?: string;
  phase: GeneratePhase;
  /** Active translation backend — **non-secret** (for logs / `--json` consumers). */
  providerId?: TranslationProviderId;
  /** e.g. LLM model id when using an AI provider — **never** API keys or tokens. */
  translationModel?: string;
};

export type SyncProgressEvent = ProgressEvent<'sync'> & {
  target?: string;
  phase: SyncPhase;
};

export type ValidateProgressEvent = ProgressEvent<'validate'> & {
  phase: ValidatePhase;
};

type RunSummaryEventFor<T extends OperationId> = Omit<RunEventBase, 'op'> & {
  op: T;
  type: 'run.summary';
  at: number;
  ok: boolean;
  issueCount: number;
  counts: RunCountsByOperation[T];
};

export type RunSummaryEvent = {
  [K in OperationId]: RunSummaryEventFor<K>;
}[OperationId];

export type RunEvent =
  | RunStartedEvent
  | RunWarningEvent
  | RunErrorEvent
  | RunMessageEvent
  | RunFailedEvent
  | RunCompletedEvent
  | RunSummaryEvent
  | GenerateProgressEvent
  | SyncProgressEvent
  | ValidateProgressEvent
  | RunShareManifestEvent
  | RunShareSkippedEvent
  | RunShareUploadedEvent
  | RunShareLinksEvent;

export type RunEmitter = (event: RunEvent) => void;
