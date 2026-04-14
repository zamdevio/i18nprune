import type { Issue } from '@/types/core/json/envelope.js';

export type CommandSummary = {
  command: string;
  ok?: boolean;
  durationMs?: number;
  counts?: Record<string, number>;
  notes?: string[];
  /** Optional structured issues for `kind: summary` JSON line. */
  issues?: Issue[];
};
