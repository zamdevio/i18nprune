import type { CoreContext } from '../context/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { ShareCacheEntry, ShareLinks } from './entry.js';
import type { ShareProjectManifest } from './manifest.js';

export type ShareWorkerProjectRef = {
  kind: 'project';
  workerBaseUrl: string;
  workerProjectId: string;
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

export type ShareRunInput = ShareRunInputProjectBuild | ShareRunInputProjectWorkerRef;

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
  uploadProject?: (input: {
    workerBaseUrl: string;
    zipBytes: Uint8Array;
  }) => Promise<{ httpStatus: number; body: unknown }>;
};

export type ShareSkippedReason =
  | 'dry_run'
  | 'hash_unchanged'
  | 'user_cancelled_confirm'
  | 'worker_ref_link_only';

export type ShareRunResult = {
  action: 'uploaded' | 'skipped' | 'link-only';
  kind: 'project';
  manifest?: ShareProjectManifest;
  links: ShareLinks;
  workerIds: { projectId?: string; reportId?: string };
  cacheEntry?: ShareCacheEntry;
  issues: Issue[];
  skippedReason?: ShareSkippedReason;
};
