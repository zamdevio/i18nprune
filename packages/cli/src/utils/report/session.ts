import type { ReportEntry } from '@/types/utils/report/index.js';

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
