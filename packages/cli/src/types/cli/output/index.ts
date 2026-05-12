import type { Issue } from '@i18nprune/core';

export type CommandSummary = {
  command: string;
  ok?: boolean;
  durationMs?: number;
  counts?: Record<string, number>;
  notes?: string[];
  /** Optional structured issues for `kind: summary` JSON line. */
  issues?: Issue[];
};
