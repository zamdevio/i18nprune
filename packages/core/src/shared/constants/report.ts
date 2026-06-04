/** `ProjectReportDocument.kind` wire value (see `@i18nprune/core/report-schema`). */
export const PROJECT_REPORT_KIND = 'i18nprune.projectReport' as const;

/** `ProjectReportDocument.schemaVersion` for hosted report ingest. */
export const PROJECT_REPORT_SCHEMA_VERSION = 1 as const;

/** Placeholder in built HTML before the CLI inlines the JSON payload. */
export const REPORT_INLINE_PAYLOAD_PLACEHOLDER = '__I18NPRUNE_REPORT__' as const;
