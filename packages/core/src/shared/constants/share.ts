import { PROJECT_UPLOAD_MAX_ZIP_BYTES } from './project.js';
import type { CacheDispatchReason } from '../../types/cache/index.js';

/** On-disk share cache filename beside `files.json` / `analysis.json`. */
export const SHARE_JSON_BASENAME = 'share.json' as const;

/** Subdirectory under the project cache dir for raw `share.json` backups (keeps the cache root tidy). */
export const SHARE_BAK_DIRNAME = 'share.bak' as const;

/** Default max UTF-8 bytes for `share.json` reads (entries are small). */
export const DEFAULT_MAX_SHARE_JSON_BYTES = 512 * 1024;

/** Max UTF-8 bytes for a stored shared report document (`POST /v1/reports`). */
export const REPORT_SHARE_MAX_BYTES = 8 * 1024 * 1024;

/**
 * Max UTF-8 bytes for hosted **project** prepared JSON (`POST /v1/projects`).
 * Same cap as zip upload (`PROJECT_UPLOAD_ZIP_LIMITS.maxZipBytes`) — **not** the report limit.
 */
export const PROJECT_SHARE_PREPARED_MAX_BYTES = PROJECT_UPLOAD_MAX_ZIP_BYTES;

export type ShareCacheReasonCode = CacheDispatchReason | 'archive_ingest_no_project_cache';

/** Human-facing copy for known cache analysis reasons in share CLI/view output. */
export const SHARE_CACHE_REASON_MESSAGES: Partial<Record<ShareCacheReasonCode, string>> = {
  cache_hit: 'analysis cache hit',
  no_cache: 'project cache is disabled',
  cache_unavailable: 'project cache is unavailable',
  run_missing: 'cached analysis run is missing',
  files_changed: 'tracked files changed since last analysis',
  files_index_recovered: 'cache files index was recovered',
  run_binding_stale: 'cached analysis binding is stale',
  producer_succeeded: 'analysis recomputed and cache updated',
  run_invalid: 'cached analysis run is invalid',
  archive_ingest_no_project_cache: 'archive uploads do not use persistent project cache',
};
