/**
 * Stable issue code identifiers shared across CLI and other hosts.
 * @see docs/issues/README.md
 */
export const ISSUE_CONTEXT_DISCOVERY_WARNING = 'i18nprune.context.discovery_warning' as const;
export const ISSUE_CONTEXT_RESOLUTION_FAILED = 'i18nprune.context.resolution_failed' as const;
export const ISSUE_VALIDATE_MISSING_LITERAL_KEYS = 'i18nprune.validate.missing_literal_keys' as const;
export const ISSUE_VALIDATE_DYNAMIC_KEY_SITES = 'i18nprune.validate.dynamic_key_sites' as const;
export const ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED = 'i18nprune.validate.source_locale_unreadable' as const;
export const ISSUE_SCAN_DYNAMIC_KEY_SITES = 'i18nprune.scan.dynamic_key_sites' as const;
export const ISSUE_MISSING_PATHS_NOT_IN_SCAN = 'i18nprune.missing.paths_not_in_current_scan' as const;
export const ISSUE_SYNC_LOCALE_FILE_NOT_FOUND = 'i18nprune.sync.locale_file_not_found' as const;
export const ISSUE_SYNC_METADATA_FLAG_CONFLICT = 'i18nprune.sync.metadata_flag_conflict' as const;
export const ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES = 'i18nprune.locale.source_placeholder_leaves' as const;
export const ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES = 'i18nprune.locale.target_placeholder_leaves' as const;
export const ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED = 'i18nprune.cleanup.uncertain_paths_excluded' as const;
export const ISSUE_CLEANUP_RIPGREP_UNAVAILABLE = 'i18nprune.cleanup.ripgrep_unavailable' as const;
export const ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES = 'i18nprune.quality.english_identical_leaves' as const;
export const ISSUE_LANGUAGES_EMPTY_FILTER = 'i18nprune.languages.empty_filter' as const;
export const ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE = 'i18nprune.languages.unsupported_language_code' as const;
export const ISSUE_CONFIG_MISSING = 'i18nprune.config.missing' as const;
export const ISSUE_CONFIG_INVALID = 'i18nprune.config.invalid' as const;
export const ISSUE_CONFIG_LOAD_FAILED = 'i18nprune.config.load_failed' as const;
export const ISSUE_LOCALES_USAGE = 'i18nprune.locales.usage' as const;
export const ISSUE_LOCALE_TARGET_NOT_FOUND = 'i18nprune.locale.target_not_found' as const;
export const ISSUE_IO_READ_FAILED = 'i18nprune.io.read_failed' as const;
export const ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING = 'i18nprune.translate.identity_streak_warning' as const;
export const ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT = 'i18nprune.translate.identity_streak_abort' as const;
export const ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER =
  'i18nprune.translate.unknown_translation_provider' as const;
export const ISSUE_TRANSLATE_PROVIDER_NOT_IMPLEMENTED_YET =
  'i18nprune.translate.provider_not_implemented_yet' as const;
export const ISSUE_TRANSLATE_MISSING_CREDENTIALS = 'i18nprune.translate.missing_credentials' as const;
export const ISSUE_TRANSLATE_CONFIG_DEFAULT_APPLIED = 'i18nprune.translate.config_default_applied' as const;
export const ISSUE_TRANSLATE_HANDOFF_NO_ELIGIBLE_PROVIDER =
  'i18nprune.translate.handoff_no_eligible_provider' as const;
export const ISSUE_GENERATE_USAGE = 'i18nprune.generate.usage' as const;
export const ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES =
  'i18nprune.generate.source_empty_string_leaves' as const;
export const ISSUE_GENERATE_TRANSLATE_RATE_LIMITED =
  'i18nprune.generate.translate_rate_limited' as const;
export const ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR =
  'i18nprune.generate.translate_network_error' as const;
export const ISSUE_REPORT_INVALID_FORMAT = 'i18nprune.report.invalid_format' as const;
export const ISSUE_CLI_INVALID_JSON_PRETTY = 'i18nprune.cli.invalid_json_pretty' as const;
export const ISSUE_PATCHING_CONFIG_SIZE_ANOMALY = 'i18nprune.patching.config_size_anomaly' as const;
export const ISSUE_PATCHING_CONFIG_TOO_LARGE = 'i18nprune.patching.config_too_large' as const;
export const ISSUE_PATCHING_CONFIG_INVALID_SCHEMA = 'i18nprune.patching.config_invalid_schema' as const;
export const ISSUE_PATCHING_CONFIG_PARSE_FAILED = 'i18nprune.patching.config_parse_failed' as const;
export const ISSUE_PATCHING_CONFIG_LOCALE_MISSING_FILE = 'i18nprune.patching.config_locale_missing_file' as const;
export const ISSUE_PATCHING_FILE_LOCALE_MISSING_CONFIG = 'i18nprune.patching.file_locale_missing_config' as const;
export const ISSUE_PATCHING_CATALOG_MISMATCH_ENGLISH = 'i18nprune.patching.catalog_mismatch_english_name' as const;
export const ISSUE_PATCHING_CATALOG_MISMATCH_NATIVE = 'i18nprune.patching.catalog_mismatch_native_name' as const;
export const ISSUE_PATCHING_CATALOG_MISMATCH_DIRECTION = 'i18nprune.patching.catalog_mismatch_direction' as const;
export const ISSUE_PATCHING_CONFIG_SECTION_INCOMPLETE = 'i18nprune.patching.config_section_incomplete' as const;
export const ISSUE_DOCTOR_RUNTIME_UNSUPPORTED_NODE = 'i18nprune.doctor.runtime_unsupported_node' as const;
export const ISSUE_DOCTOR_TOOLS_RG_NOT_ON_PATH = 'i18nprune.doctor.tools_rg_not_on_path' as const;
export const ISSUE_DOCTOR_CONFIG_MISSING_FILE = 'i18nprune.doctor.config_missing_file' as const;
export const ISSUE_DOCTOR_PATHS_SOURCE_LOCALE_MISSING = 'i18nprune.doctor.paths_source_locale_missing' as const;
export const ISSUE_DOCTOR_PATHS_DIRECTORIES_MISSING = 'i18nprune.doctor.paths_directories_missing' as const;
