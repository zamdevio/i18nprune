import type { SHARE_HISTORY_EXPORT_SCHEMA_VERSION } from '../../constants/shareHistory.js';
import type { ReportAppSettings } from './settings.js';

export type ShareHistoryActivity = 'viewed' | 'shared';

export type ShareHistoryEntry = {
  reportId: string;
  shareUrl: string;
  workerBaseUrl: string;
  activities: ShareHistoryActivity[];
  lastSeenAt: string;
  toolVersion?: string;
  generatedAt?: string;
};

export type ShareHistoryExportFile = {
  schemaVersion: typeof SHARE_HISTORY_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  settings: ReportAppSettings;
  entries: ShareHistoryEntry[];
};
