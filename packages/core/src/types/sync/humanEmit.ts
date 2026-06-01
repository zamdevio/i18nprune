import type { SyncFileLine } from './syncRun.js';
import type { SyncHumanLeafSummary } from './humanLeafSummary.js';

export type SyncLocaleDisplayGroup = {
  localeCode: string;
  reportKeys: string[];
  fileLines: SyncFileLine[];
  changedCount: number;
  summaries: SyncHumanLeafSummary[];
};
