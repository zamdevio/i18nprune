export type ReportFormat = 'json' | 'text' | 'csv';

export type ReportEntry = {
  level: 'info' | 'warn' | 'error';
  command: string;
  message: string;
  data?: Record<string, unknown>;
};

export type ReportRunMeta = {
  command: string;
  ok?: boolean;
  durationMs?: number;
  counts?: Record<string, number>;
};
