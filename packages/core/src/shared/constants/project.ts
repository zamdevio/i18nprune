/**
 * Limits for uploaded project zip archives (worker ingest + web local preview).
 * Share payload preparation (`buildProjectPayload`) uses the same caps.
 */
export const PROJECT_UPLOAD_ZIP_LIMITS = {
  maxZipBytes: 50 * 1024 * 1024,
  maxFiles: 15_000,
  maxTextBytes: 60 * 1024 * 1024,
} as const;

export const PROJECT_UPLOAD_MAX_ZIP_BYTES = PROJECT_UPLOAD_ZIP_LIMITS.maxZipBytes;
export const PROJECT_UPLOAD_MAX_FILES = PROJECT_UPLOAD_ZIP_LIMITS.maxFiles;
export const PROJECT_UPLOAD_MAX_TEXT_BYTES = PROJECT_UPLOAD_ZIP_LIMITS.maxTextBytes;

/** Wire format version for `POST /v1/projects` prepared snapshot ingest. */
export const HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION = 1 as const;
