/**
 * Stable issue code identifiers shared across CLI and other hosts.
 * @see docs/issues/README.md
 */
/** Discovery produced warnings (non-fatal); surfaced in `issues[]` for automation. */
export const ISSUE_CONTEXT_DISCOVERY_WARNING = 'i18nprune.context.discovery_warning' as const;
/** Workspace context could not be resolved (fatal for the current command). */
export const ISSUE_CONTEXT_RESOLUTION_FAILED = 'i18nprune.context.resolution_failed' as const;
/** Validate: literal keys present in source but missing from the source locale JSON. */
export const ISSUE_VALIDATE_MISSING_LITERAL_KEYS = 'i18nprune.validate.missing_literal_keys' as const;
/** Validate: non-literal translation key sites (dynamic keys) detected in the scan. */
export const ISSUE_VALIDATE_DYNAMIC_KEY_SITES = 'i18nprune.validate.dynamic_key_sites' as const;
/** Validate: configured source locale file could not be read or parsed as expected. */
export const ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED = 'i18nprune.validate.source_locale_unreadable' as const;
/** Shared workspace preflight: no `i18nprune.config.*` on disk — merged config is defaults + env/discovery/CLI only. */
export const ISSUE_PROJECT_CONFIG_FILE_MISSING = 'i18nprune.project.config_file_missing' as const;
/** Shared workspace preflight: source locale path missing, wrong type, unreadable, or not a JSON object when required. */
export const ISSUE_PROJECT_SOURCE_LOCALE_UNAVAILABLE = 'i18nprune.project.source_locale_unavailable' as const;
/** Shared workspace preflight: locales directory missing or not usable. */
export const ISSUE_PROJECT_LOCALES_DIR_UNAVAILABLE = 'i18nprune.project.locales_dir_unavailable' as const;
/** Shared workspace preflight: configured `src` root missing or not a directory. */
export const ISSUE_PROJECT_SRC_ROOT_UNAVAILABLE = 'i18nprune.project.src_root_unavailable' as const;
/** `locales.mode` is `locale_directory` but `locales.structure` is missing (required — no implicit guess). */
export const ISSUE_PROJECT_LOCALES_STRUCTURE_REQUIRED =
  'i18nprune.project.locales_structure_required' as const;
/** `locales.source` is a file path or `*.json` basename — must be a language code (e.g. en). */
export const ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE =
  'i18nprune.project.locales_source_not_language_code' as const;
/** `locales.source` is a valid catalog code but no locale segments exist for it under `locales.directory`. */
export const ISSUE_PROJECT_LOCALES_SOURCE_NOT_IN_BUNDLE =
  'i18nprune.project.locales_source_not_in_bundle' as const;
/** Source locale code exists but is missing JSON segment slot(s) other locales have (`locale_per_dir` / `feature_bundle`). */
export const ISSUE_PROJECT_SOURCE_LOCALE_MISSING_SEGMENTS =
  'i18nprune.project.source_locale_missing_segments' as const;
/** Scan / report pipeline: dynamic (non-literal) key sites counted for reporting. */
export const ISSUE_SCAN_DYNAMIC_KEY_SITES = 'i18nprune.scan.dynamic_key_sites' as const;
/** Missing op: requested paths are not covered by the current scan surface. */
export const ISSUE_MISSING_PATHS_NOT_IN_SCAN = 'i18nprune.missing.paths_not_in_current_scan' as const;
/** Sync: expected locale JSON file not found on disk. */
export const ISSUE_SYNC_LOCALE_FILE_NOT_FOUND = 'i18nprune.sync.locale_file_not_found' as const;
/** Sync: incompatible combination of `--metadata` / `--strip-metadata` (or related flags). */
export const ISSUE_SYNC_METADATA_FLAG_CONFLICT = 'i18nprune.sync.metadata_flag_conflict' as const;
/** Locale read: source JSON contains placeholder-only leaves where real copy is expected. */
export const ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES = 'i18nprune.locale.source_placeholder_leaves' as const;
/** Locale read: target JSON still has placeholder leaves (e.g. untranslated stubs). */
export const ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES = 'i18nprune.locale.target_placeholder_leaves' as const;
/** Cleanup: paths skipped because classification was uncertain (safety). */
export const ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED = 'i18nprune.cleanup.uncertain_paths_excluded' as const;
/** Cleanup: ripgrep (`rg`) not available where required for the cleanup strategy. */
export const ISSUE_CLEANUP_RIPGREP_UNAVAILABLE = 'i18nprune.cleanup.ripgrep_unavailable' as const;
/** Quality: English source and target literal strings are identical (possible copy drift). */
export const ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES = 'i18nprune.quality.english_identical_leaves' as const;
/** Languages list: filter produced an empty result set. */
export const ISSUE_LANGUAGES_EMPTY_FILTER = 'i18nprune.languages.empty_filter' as const;
/** Languages: requested code is not in the supported catalog / normalization failed. */
export const ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE = 'i18nprune.languages.unsupported_language_code' as const;
/** Config: expected config file path has no file. */
export const ISSUE_CONFIG_MISSING = 'i18nprune.config.missing' as const;
/** Config: file exists but failed schema or semantic validation. */
export const ISSUE_CONFIG_INVALID = 'i18nprune.config.invalid' as const;
/** Config: IO or parse failure while loading config. */
export const ISSUE_CONFIG_LOAD_FAILED = 'i18nprune.config.load_failed' as const;
/** Locales command usage / invocation error. */
export const ISSUE_LOCALES_USAGE = 'i18nprune.locales.usage' as const;
/** Locales: requested target locale tag has no backing files. */
export const ISSUE_LOCALE_TARGET_NOT_FOUND = 'i18nprune.locale.target_not_found' as const;
/** Filesystem read failed for a path the engine needed. */
export const ISSUE_IO_READ_FAILED = 'i18nprune.io.read_failed' as const;
/** Translate: repeated identity / echo-like translations exceeded warning threshold. */
export const ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING = 'i18nprune.translate.identity_streak_warning' as const;
/** Translate: identity streak exceeded abort threshold; run stopped. */
export const ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT = 'i18nprune.translate.identity_streak_abort' as const;
/** Translate: provider id from config/env is unknown to the engine. */
export const ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER =
  'i18nprune.translate.unknown_translation_provider' as const;
/** Translate: provider is recognized but not implemented in this build. */
export const ISSUE_TRANSLATE_PROVIDER_NOT_IMPLEMENTED_YET =
  'i18nprune.translate.provider_not_implemented_yet' as const;
/** Translate: required API key or credential missing for the selected provider. */
export const ISSUE_TRANSLATE_MISSING_CREDENTIALS = 'i18nprune.translate.missing_credentials' as const;
/** Translate: defaults were applied because config omitted provider details (informational). */
export const ISSUE_TRANSLATE_CONFIG_DEFAULT_APPLIED = 'i18nprune.translate.config_default_applied' as const;
/** Translate: handoff mode had no eligible provider after filtering. */
export const ISSUE_TRANSLATE_HANDOFF_NO_ELIGIBLE_PROVIDER =
  'i18nprune.translate.handoff_no_eligible_provider' as const;
/** Generate: CLI usage / flags invalid for this invocation. */
export const ISSUE_GENERATE_USAGE = 'i18nprune.generate.usage' as const;
/** Generate: source locale contains empty string leaves where values are required. */
export const ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES =
  'i18nprune.generate.source_empty_string_leaves' as const;
/** Generate: translation backend rate-limited (HTTP 429, etc.). */
export const ISSUE_GENERATE_TRANSLATE_RATE_LIMITED =
  'i18nprune.generate.translate_rate_limited' as const;
/** Generate: translation network / transport failure. */
export const ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR =
  'i18nprune.generate.translate_network_error' as const;
/** Report: output format or embedded payload does not match the project report contract. */
export const ISSUE_REPORT_INVALID_FORMAT = 'i18nprune.report.invalid_format' as const;
/** CLI: `--json` pretty-print requested in a context where it is not supported. */
export const ISSUE_CLI_INVALID_JSON_PRETTY = 'i18nprune.cli.invalid_json_pretty' as const;
/** `share.json` was invalid or manually edited — core repaired it automatically. */
export const ISSUE_SHARE_JSON_REPAIRED = 'i18nprune.share.json_repaired' as const;
/** `share delete` / `--project` / `--report`: no matching row in local `share.json` (worker DELETE may still run). */
export const ISSUE_SHARE_CACHE_ENTRY_NOT_FOUND = 'i18nprune.share.cache_entry_not_found' as const;
/** Stale `share.json` row removed after worker 404 during upload skip probe (fresh upload follows). */
export const ISSUE_SHARE_STALE_CACHE_ROW_REMOVED = 'i18nprune.share.stale_cache_row_removed' as const;
/** No rows in local `share.json` (view/delete/list without `--project` / `--report` / `--all`). */
export const ISSUE_SHARE_CACHE_EMPTY = 'i18nprune.share.cache_empty' as const;
/** Failed to persist repaired or updated `share.json`. */
export const ISSUE_SHARE_JSON_WRITE_FAILED = 'i18nprune.share.json_write_failed' as const;
/** Worker returned 404 for a project id (unknown or evicted after idle TTL). */
export const ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND = 'i18nprune.share.remote_project_not_found' as const;
/** Worker returned 404 for a report id (unknown or evicted). */
export const ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND = 'i18nprune.share.remote_report_not_found' as const;
/** Prepared zip or upload exceeded worker limits. */
export const ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE = 'i18nprune.share.remote_payload_too_large' as const;
/** Report JSON rejected by worker (size or schema). */
export const ISSUE_SHARE_REMOTE_REPORT_REJECTED = 'i18nprune.share.remote_report_rejected' as const;
/** Other worker upload / processing rejection. */
export const ISSUE_SHARE_REMOTE_UPLOAD_REJECTED = 'i18nprune.share.remote_upload_rejected' as const;
/** Worker unavailable (5xx, network, timeout). */
export const ISSUE_SHARE_REMOTE_UNAVAILABLE = 'i18nprune.share.remote_unavailable' as const;
/** Unmapped worker / HTTP error. */
export const ISSUE_SHARE_REMOTE_ERROR = 'i18nprune.share.remote_error' as const;
/** Prepared project snapshot had no eligible files after excludes (empty zip). */
export const ISSUE_SHARE_SNAPSHOT_EMPTY = 'i18nprune.share.snapshot_empty' as const;
/** Local zip build failed (e.g. `fflate` error). */
export const ISSUE_SHARE_ZIP_FAILED = 'i18nprune.share.zip_failed' as const;
/** Patching: config payload size looks anomalous vs expectations. */
export const ISSUE_PATCHING_CONFIG_SIZE_ANOMALY = 'i18nprune.patching.config_size_anomaly' as const;
/** Patching: config payload exceeds hard size cap. */
export const ISSUE_PATCHING_CONFIG_TOO_LARGE = 'i18nprune.patching.config_too_large' as const;
/** Patching: config JSON does not match the patching config schema. */
export const ISSUE_PATCHING_CONFIG_INVALID_SCHEMA = 'i18nprune.patching.config_invalid_schema' as const;
/** Patching: config JSON exists but failed to parse. */
export const ISSUE_PATCHING_CONFIG_PARSE_FAILED = 'i18nprune.patching.config_parse_failed' as const;
/** Patching: config references a locale file path that does not exist. */
export const ISSUE_PATCHING_CONFIG_LOCALE_MISSING_FILE = 'i18nprune.patching.config_locale_missing_file' as const;
/** Patching: locale file on disk is not covered by patching config (orphan / mismatch). */
export const ISSUE_PATCHING_FILE_LOCALE_MISSING_CONFIG = 'i18nprune.patching.file_locale_missing_config' as const;
/** Patching: language catalog English name does not match config/catalog expectation. */
export const ISSUE_PATCHING_CATALOG_MISMATCH_ENGLISH = 'i18nprune.patching.catalog_mismatch_english_name' as const;
/** Patching: language catalog native name does not match config/catalog expectation. */
export const ISSUE_PATCHING_CATALOG_MISMATCH_NATIVE = 'i18nprune.patching.catalog_mismatch_native_name' as const;
/** Patching: language catalog text direction does not match config/catalog expectation. */
export const ISSUE_PATCHING_CATALOG_MISMATCH_DIRECTION = 'i18nprune.patching.catalog_mismatch_direction' as const;
/** Patching: `patching` config section present but incomplete (missing required fields). */
export const ISSUE_PATCHING_CONFIG_SECTION_INCOMPLETE = 'i18nprune.patching.config_section_incomplete' as const;
/** Doctor: Node.js version is below the supported minimum for this toolchain. */
export const ISSUE_DOCTOR_RUNTIME_UNSUPPORTED_NODE = 'i18nprune.doctor.runtime_unsupported_node' as const;
/** Doctor: `rg` (ripgrep) not found on `PATH` when expected. */
export const ISSUE_DOCTOR_TOOLS_RG_NOT_ON_PATH = 'i18nprune.doctor.tools_rg_not_on_path' as const;
/** Doctor: configured i18nprune config file path is missing. */
export const ISSUE_DOCTOR_CONFIG_MISSING_FILE = 'i18nprune.doctor.config_missing_file' as const;
/** Doctor: source locale file missing or unreadable at resolved path. */
export const ISSUE_DOCTOR_PATHS_SOURCE_LOCALE_MISSING = 'i18nprune.doctor.paths_source_locale_missing' as const;
/** Doctor: required project directories (e.g. `src`, locales root) missing. */
export const ISSUE_DOCTOR_PATHS_DIRECTORIES_MISSING = 'i18nprune.doctor.paths_directories_missing' as const;
/** Locale or project path segment uses a Windows reserved device name (CON, NUL, COM1, …). */
export const ISSUE_PATHS_WINDOWS_RESERVED_NAME = 'i18nprune.paths.windows_reserved_name' as const;
/** Absolute path may exceed legacy Win32 `MAX_PATH` without extended-length prefix. */
export const ISSUE_PATHS_WINDOWS_LONG_PATH = 'i18nprune.paths.windows_long_path' as const;
/** Project root or locale tree is on a UNC network share. */
export const ISSUE_PATHS_NETWORK_DRIVE = 'i18nprune.paths.network_drive' as const;
/** Hosted `POST /v1/projects` JSON ingest body failed validation. */
export const ISSUE_PROJECT_HOSTED_SNAPSHOT_INVALID = 'i18nprune.project.hosted_snapshot_invalid' as const;
/** Hosted project ingest `schemaVersion` mismatch. */
export const ISSUE_PROJECT_HOSTED_SNAPSHOT_SCHEMA_VERSION = 'i18nprune.project.hosted_snapshot_schema_version' as const;
/** Archive prepare: invalid `configJson` override on upload. */
export const ISSUE_PROJECT_UPLOAD_CONFIG_JSON_INVALID = 'i18nprune.project.upload_config_json_invalid' as const;
/** Archive prepare: normalized config missing required fields. */
export const ISSUE_PROJECT_UPLOAD_CONFIG_REQUIRED = 'i18nprune.project.upload_config_required' as const;
/** Archive prepare: source locale file missing from zip / snapshot paths. */
export const ISSUE_PROJECT_SOURCE_LOCALE_NOT_FOUND = 'i18nprune.project.source_locale_not_found' as const;
/** Archive prepare: source locale file is not valid JSON. */
export const ISSUE_PROJECT_SOURCE_LOCALE_INVALID_JSON = 'i18nprune.project.source_locale_invalid_json' as const;
/** Archive prepare: source locale JSON root is not an object. */
export const ISSUE_PROJECT_SOURCE_LOCALE_INVALID_SHAPE = 'i18nprune.project.source_locale_invalid_shape' as const;
/** Hosted `POST /v1/reports` JSON ingest body failed validation. */
export const ISSUE_REPORT_HOSTED_REPORT_INVALID = 'i18nprune.report.hosted_report_invalid' as const;
/** Combined share prepare: neither project nor report requested. */
export const ISSUE_SHARE_PREPARE_NOTHING_REQUESTED = 'i18nprune.share.prepare_nothing_requested' as const;
/** Combined share prepare: `reportHost` required when preparing a report. */
export const ISSUE_SHARE_PREPARE_REPORT_HOST_REQUIRED = 'i18nprune.share.prepare_report_host_required' as const;
/** Share prepare: failed applying cached analysis to project snapshot. */
export const ISSUE_SHARE_PREPARE_ANALYSIS_FAILED = 'i18nprune.share.prepare_analysis_failed' as const;
/** Report prepare from project zip archive failed after snapshot extraction. */
export const ISSUE_SHARE_PREPARE_REPORT_FROM_ARCHIVE_FAILED =
  'i18nprune.share.prepare_report_from_archive_failed' as const;
