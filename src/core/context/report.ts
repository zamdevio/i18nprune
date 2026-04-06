import type { ReportFormat } from '@/utils/report/types.js';

export type { ReportFormat };

let reportPath: string | undefined;
let reportFormatOverride: ReportFormat | undefined;

export function resetReportCliOptions(): void {
  reportPath = undefined;
  reportFormatOverride = undefined;
}

export function setReportCliOptions(path: string | undefined, format: ReportFormat | undefined): void {
  reportPath = path;
  reportFormatOverride = format;
}

export function getReportFilePath(): string | undefined {
  return reportPath;
}

export function getReportFormatOverride(): ReportFormat | undefined {
  return reportFormatOverride;
}
