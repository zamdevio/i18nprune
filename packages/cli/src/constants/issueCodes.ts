/**
 * Stable `Issue.code` strings for CLI `issues[]` and programmatic consumers.
 * @see docs/json/issue-codes.md
 */
export const ISSUE_CONTEXT_DISCOVERY_WARNING = 'i18nprune.context.discovery_warning' as const;
export const ISSUE_CONTEXT_RESOLUTION_FAILED = 'i18nprune.context.resolution_failed' as const;
export const ISSUE_VALIDATE_MISSING_LITERAL_KEYS = 'i18nprune.validate.missing_literal_keys' as const;
export const ISSUE_VALIDATE_DYNAMIC_KEY_SITES = 'i18nprune.validate.dynamic_key_sites' as const;
export const ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED = 'i18nprune.validate.source_locale_unreadable' as const;
export const ISSUE_SCAN_DYNAMIC_KEY_SITES = 'i18nprune.scan.dynamic_key_sites' as const;
export const ISSUE_MISSING_PATHS_NOT_IN_SCAN = 'i18nprune.missing.paths_not_in_current_scan' as const;
export const ISSUE_SYNC_LOCALE_FILE_NOT_FOUND = 'i18nprune.sync.locale_file_not_found' as const;
export const ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED = 'i18nprune.cleanup.uncertain_paths_excluded' as const;
export const ISSUE_CLEANUP_RIPGREP_UNAVAILABLE = 'i18nprune.cleanup.ripgrep_unavailable' as const;
export const ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES = 'i18nprune.quality.english_identical_leaves' as const;
export const ISSUE_LANGUAGES_EMPTY_FILTER = 'i18nprune.languages.empty_filter' as const;
export const ISSUE_FILL_USAGE = 'i18nprune.fill.usage' as const;
export const ISSUE_LOCALES_USAGE = 'i18nprune.locales.usage' as const;
export const ISSUE_LOCALE_TARGET_NOT_FOUND = 'i18nprune.locale.target_not_found' as const;
export const ISSUE_IO_READ_FAILED = 'i18nprune.io.read_failed' as const;
export const ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING = 'i18nprune.translate.identity_streak_warning' as const;
export const ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT = 'i18nprune.translate.identity_streak_abort' as const;
export const ISSUE_REPORT_INVALID_FORMAT = 'i18nprune.report.invalid_format' as const;
export const ISSUE_CLI_INVALID_JSON_PRETTY = 'i18nprune.cli.invalid_json_pretty' as const;

/** Build stable doctor issue codes for findings (`i18nprune.doctor.<id>`). */
export function doctorIssueCode(id: string): string {
  return `i18nprune.doctor.${id}`;
}
