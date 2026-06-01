import type { Issue } from '../json/envelope/index.js';

export type SaveShareJsonResult = {
  warning?: Issue;
};

export type ShareJsonBackupResult = {
  created: boolean;
  /** Absolute path to the backup file when {@link created} is true. */
  bakPath?: string;
};

export type ShareCacheDebugLine = {
  level: 'info' | 'detail';
  message: string;
};
