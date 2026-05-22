import type { CoreContext } from '../context/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { HostedIngestProcessorContext, ProjectStoredMetadata } from '../project/metadata.js';
import type { StoredReportMetadata } from '../project/reportStore.js';
import type { HostedProjectIngestEnvelope } from '../project/prepare.js';
import type { ShareCacheEntry, ShareJsonFile, ShareJsonHealReport, ShareLinks } from './entry.js';

/** Reused across multiple {@link runShare} calls in one host command (e.g. CLI `--project` + `--report`). */
export type ShareRunShareJsonSession = {
  sharePath?: string;
  shareFile: ShareJsonFile;
  /** After the first load, suppress repeated `share.json` / `entries loaded` `[cache]` lines. */
  shareJsonLoadDebugDone?: boolean;
};
import type { ShareManifest, ShareProjectManifest, ShareReportManifest } from './manifest.js';

export type ShareWorkerProjectRef = {
  kind: 'project';
  workerBaseUrl: string;
  workerProjectId: string;
};

export type ShareWorkerReportRef = {
  kind: 'report';
  workerBaseUrl: string;
  workerReportId: string;
};

export type ShareRunInputProjectBuild = {
  ctx: CoreContext;
  /** Absolute project root (host resolves from config path / cwd). */
  projectRoot: string;
  workerBaseUrl: string;
  kind: 'project';
  source: 'build';
  force?: boolean;
  hooks: ShareHostHooks;
  /** When set, skips disk prepare (e.g. combined `prepareShareHostedFromContext`). */
  prepared?: {
    envelope: HostedProjectIngestEnvelope;
    serialized: string;
    manifest: ShareProjectManifest;
  };
};

export type ShareRunInputProjectWorkerRef = {
  ctx: CoreContext;
  projectRoot: string;
  workerBaseUrl: string;
  kind: 'project';
  source: 'worker-ref';
  workerRef: ShareWorkerProjectRef;
  hooks: ShareHostHooks;
};

export type ShareRunInputReportDocument = {
  ctx: CoreContext;
  projectRoot: string;
  workerBaseUrl: string;
  kind: 'report';
  source: 'document';
  reportDocument: unknown;
  force?: boolean;
  hooks: ShareHostHooks;
  /** When set, skips {@link prepareReportPayload} (document + manifest already validated). */
  prepared?: {
    document: unknown;
    manifest: ShareReportManifest;
  };
};

export type ShareRunInputReportWorkerRef = {
  ctx: CoreContext;
  projectRoot: string;
  workerBaseUrl: string;
  kind: 'report';
  source: 'worker-ref';
  workerRef: ShareWorkerReportRef;
  hooks: ShareHostHooks;
};

export type ShareRunInput =
  | ShareRunInputProjectBuild
  | ShareRunInputProjectWorkerRef
  | ShareRunInputReportDocument
  | ShareRunInputReportWorkerRef;

export type ShareHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  /** When true, emit `[cache]` diagnostics (host maps to `--debug-cache`). */
  debugCache?: boolean;
  /** When true, core stops after manifest + policy (no upload hooks). */
  dryRun?: boolean;
  /** When false, core skips `confirmUpload` and uploads immediately after manifest (unless policy skips). */
  interactive?: boolean;
  confirmUpload?: (input: { message: string; defaultValue: boolean }) => Promise<boolean>;
  fetchRemoteProjectRow?: (input: {
    workerBaseUrl: string;
    projectId: string;
  }) => Promise<{ httpStatus: number; body: unknown }>;
  fetchRemoteReportRow?: (input: {
    workerBaseUrl: string;
    reportId: string;
  }) => Promise<{ httpStatus: number; body: unknown }>;
  uploadProject?: (input: {
    workerBaseUrl: string;
    envelope: HostedProjectIngestEnvelope;
    serialized: string;
  }) => Promise<{ httpStatus: number; body: unknown }>;
  uploadReport?: (input: {
    workerBaseUrl: string;
    document: unknown;
  }) => Promise<{ httpStatus: number; body: unknown }>;
  deleteRemoteProject?: (input: { workerBaseUrl: string; projectId: string }) => Promise<{ httpStatus: number; body: unknown }>;
  deleteRemoteReport?: (input: { workerBaseUrl: string; reportId: string }) => Promise<{ httpStatus: number; body: unknown }>;
  /** When set, reuse in-memory `share.json` across back-to-back uploads in one CLI invocation. */
  shareJsonSession?: ShareRunShareJsonSession;
  /** Host SDK / machine context attached to JSON ingest envelopes. */
  processorContext?: HostedIngestProcessorContext;
};

export type ShareSkippedReason =
  | 'dry_run'
  | 'hash_unchanged'
  | 'cache_epoch_unchanged'
  | 'user_cancelled_confirm'
  | 'worker_ref_link_only';

export type ShareRunResult = {
  action: 'uploaded' | 'skipped' | 'link-only';
  kind: 'project' | 'report';
  manifest?: ShareManifest;
  links: ShareLinks;
  workerIds: { projectId?: string; reportId?: string };
  cacheEntry?: ShareCacheEntry;
  issues: Issue[];
  skippedReason?: ShareSkippedReason;
  /** Rows removed from `share.json` after worker 404 during skip probe (re-upload follows). */
  purgedStaleCacheRows?: Array<{ kind: 'project' | 'report'; workerId: string }>;
};

export type ShareListInput = {
  ctx: CoreContext;
};

export type ShareListResult = {
  entries: ShareCacheEntry[];
  issues: Issue[];
  heal: ShareJsonHealReport;
};

export type ShareViewInput = {
  ctx: CoreContext;
  kind: 'project' | 'report';
  workerBaseUrl: string;
  workerId: string;
  hooks: Pick<ShareHostHooks, 'fetchRemoteProjectRow' | 'fetchRemoteReportRow'>;
  /** When true (default), drop matching `share.json` rows after worker not-found (not on network errors). */
  purgeStaleLocalOnNotFound?: boolean;
};

export type ShareViewResult = {
  kind: 'project' | 'report';
  workerId: string;
  remote?: unknown;
  /** Parsed worker GET metadata when the response matches the stored-metadata shape. */
  remoteMetadata?: ProjectStoredMetadata | StoredReportMetadata;
  local?: ShareCacheEntry;
  links: ShareLinks;
  issues: Issue[];
  /** True when a matching `share.json` row was removed after worker not-found. */
  purgedLocalCache?: boolean;
};

export type ShareDeleteInput = {
  ctx: CoreContext;
  kind: 'project' | 'report';
  workerBaseUrl: string;
  workerId: string;
  /** When false, skip worker DELETE (local `share.json` only). Default true when host supplies delete hooks. */
  remote?: boolean;
  hooks?: Pick<ShareHostHooks, 'deleteRemoteProject' | 'deleteRemoteReport'>;
};

export type ShareDeleteResult = {
  deletedLocal: boolean;
  deletedRemote: boolean;
  /** Worker returned 404 / not-found — DELETE treated as done. */
  remoteAlreadyAbsent?: boolean;
  issues: Issue[];
};
