import type { Issue } from '@i18nprune/core';
import type { PayloadLoadResult } from '../../data/loader/index.js';
import type { ProjectReportDocument } from '@i18nprune/core/report-schema';

export type ReportLoadSource = 'inline' | 'import' | 'worker';

export type ReportBootstrapPhase = 'loading-remote' | 'blocked' | 'ready';

export type ReportBootstrap = {
  phase: ReportBootstrapPhase;
  doc: ProjectReportDocument | null;
  source: ReportLoadSource;
  workerReportId: string | null;
  loadingReportId: string | null;
  bootstrapError: (PayloadLoadResult & { ok: false }) | null;
  remoteIssue: Issue | null;
  importError: PayloadLoadResult | null;
  remoteEvictionIssue: Issue | null;
  setDocFromRaw: (raw: string) => boolean;
  clearImportError: () => void;
  openSharedReport: (reportId: string) => void;
  bindWorkerReport: (reportId: string) => void;
  /** Drop worker association only; keeps the current document (import / local share). */
  clearWorkerBinding: () => void;
  setDocFromDocument: (doc: ProjectReportDocument) => void;
  clearRemoteEvictionIssue: () => void;
  evictHostedReport: () => void;
  /** Clear the loaded report and return to the home import flow. */
  clearReportSession: () => void;
};
