import type { CoreContext } from '../context/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { ShareCacheEntry, ShareLinks } from './entry.js';
import type { ShareManifest } from './manifest.js';

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
    zipBytes: Uint8Array;
  }) => Promise<{ httpStatus: number; body: unknown }>;
  uploadReport?: (input: {
    workerBaseUrl: string;
    document: unknown;
  }) => Promise<{ httpStatus: number; body: unknown }>;
  deleteRemoteProject?: (input: { workerBaseUrl: string; projectId: string }) => Promise<{ httpStatus: number; body: unknown }>;
  deleteRemoteReport?: (input: { workerBaseUrl: string; reportId: string }) => Promise<{ httpStatus: number; body: unknown }>;
};

export type ShareSkippedReason =
  | 'dry_run'
  | 'hash_unchanged'
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
};

export type ShareListInput = {
  ctx: CoreContext;
};

export type ShareListResult = {
  entries: ShareCacheEntry[];
  issues: Issue[];
};

export type ShareViewInput = {
  ctx: CoreContext;
  kind: 'project' | 'report';
  workerBaseUrl: string;
  workerId: string;
  hooks: Pick<ShareHostHooks, 'fetchRemoteProjectRow' | 'fetchRemoteReportRow'>;
};

export type ShareViewResult = {
  kind: 'project' | 'report';
  workerId: string;
  remote?: unknown;
  local?: ShareCacheEntry;
  links: ShareLinks;
  issues: Issue[];
};

export type ShareDeleteInput = {
  ctx: CoreContext;
  kind: 'project' | 'report';
  workerBaseUrl: string;
  workerId: string;
  remote?: boolean;
  hooks?: Pick<ShareHostHooks, 'deleteRemoteProject' | 'deleteRemoteReport'>;
};

export type ShareDeleteResult = {
  deletedLocal: boolean;
  deletedRemote: boolean;
  issues: Issue[];
};
