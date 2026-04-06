import type { ReportEntry } from '@/utils/report/types.js';

const entries: ReportEntry[] = [];

export function resetReportSession(): void {
  entries.length = 0;
}

export function pushReportEntry(entry: ReportEntry): void {
  entries.push(entry);
}

export function getReportEntries(): ReportEntry[] {
  return [...entries];
}
