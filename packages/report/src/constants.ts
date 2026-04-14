/** Kind discriminator for the dedicated `report` command JSON DTO. */
export const PROJECT_REPORT_KIND = 'i18nprune.projectReport' as const;

/** Schema version for `i18nprune.projectReport` JSON documents. */
export const PROJECT_REPORT_SCHEMA_VERSION = 1 as const;

/**
 * Placeholder marker in SPA template replaced with JSON payload at report write time.
 * Must stay in sync with `apps/report/index.html`.
 */
export const REPORT_INLINE_PAYLOAD_PLACEHOLDER = '__I18NPRUNE_REPORT__' as const;
