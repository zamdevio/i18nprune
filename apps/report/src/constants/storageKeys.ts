/** localStorage key for the hosted worker base URL (report app). */
export const WORKER_URL_STORAGE_KEY = 'i18nprune-report-worker-url' as const;

/** localStorage key for share link history (viewed / shared reports). */
export const SHARE_HISTORY_STORAGE_KEY = 'i18nprune-report-share-history-v1' as const;

/** localStorage key for report app settings (history limits, etc.). */
export const REPORT_SETTINGS_STORAGE_KEY = 'i18nprune-report-settings-v1' as const;

/** Resume queue for sequential remote report deletes (delete all). */
export const REMOTE_DELETE_QUEUE_STORAGE_KEY = 'i18nprune-report-remote-delete-queue-v1' as const;
