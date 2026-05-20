/** On-disk share cache filename beside `files.json` / `analysis.json`. */
export const SHARE_JSON_BASENAME = 'share.json' as const;

/** Subdirectory under the project cache dir for raw `share.json` backups (keeps the cache root tidy). */
export const SHARE_BAK_DIRNAME = 'share.bak' as const;

/** Default max UTF-8 bytes for `share.json` reads (entries are small). */
export const DEFAULT_MAX_SHARE_JSON_BYTES = 512 * 1024;

/** Max UTF-8 bytes for a stored shared report document (`POST /v1/reports`). */
export const REPORT_SHARE_MAX_BYTES = 8 * 1024 * 1024;
