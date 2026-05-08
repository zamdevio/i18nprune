export type {
  ProjectReportDocument,
  ProjectReportEnvironment,
  ProjectReportProjectMeta,
  ProjectReportSummary,
} from '@i18nprune/report';

export type ReportCommandFormat = 'html' | 'json' | 'csv' | 'text';

/** Options for `report` CLI / {@link runReport}. */
export type ReportCliRunOptions = {
  format: ReportCommandFormat;
  out?: string;
  from?: string;
};
