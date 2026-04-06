export type CommandSummary = {
  command: string;
  ok?: boolean;
  durationMs?: number;
  counts?: Record<string, number>;
  notes?: string[];
};
