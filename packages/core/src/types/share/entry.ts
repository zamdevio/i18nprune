/**
 * Core share cache + worker envelope types (disk `share.json` + worker JSON).
 * @see maintainer/systems/share.md
 */

import type { Issue } from '../json/envelope/index.js';

export type ShareKind = 'project' | 'report';

/** On-disk `share.json` (v1) beside `files.json` / `analysis.json`. */
export type ShareJsonFile = {
  version: 1;
  entries: ShareCacheEntry[];
};

export type ShareLinks = {
  web?: string;
  report?: string;
  worker?: string;
};

/** One recorded upload from this machine (local cache metadata). */
export type ShareCacheEntry = {
  kind: ShareKind;
  workerBaseUrl: string;
  workerProjectId?: string;
  workerReportId?: string;
  payloadContentHash: string;
  configHash?: string;
  /** Tracked-files epoch from `files.json` when the project snapshot was last shared (skip zip rebuild). */
  inputFilesEpoch?: string;
  byteSize: number;
  uploadedAt: string;
  lastUsedAt: string;
  links: ShareLinks;
};

export type ShareJsonHealKind =
  | 'missing_file'
  | 'invalid_json'
  | 'oversized_file'
  | 'version_reset'
  | 'entries_sanitized'
  | 'duplicates_merged';

export type ShareJsonHealReport = {
  /** True when any corrective action was applied (including initializing an empty file). */
  repaired: boolean;
  actions: ShareJsonHealKind[];
  /** Human-readable detail lines for hosts (CLI may log once). */
  details: string[];
  /** Set when the previous `share.json` was copied under `share.bak/` before replace. */
  backupBakPath?: string;
};

export type LoadShareJsonResult = {
  file: ShareJsonFile;
  heal: ShareJsonHealReport;
  issues: Issue[];
};

/** Parsed worker JSON envelope (subset used by share / worker hosts). */
export type WorkerShareEnvelope = {
  success: boolean;
  code?: string;
  data: unknown;
  errors: Array<{ code: string; message: string }>;
  warnings?: Array<{ code: string; message: string }>;
};
