import { useContext } from 'react';
import type { Issue } from '@i18nprune/core';
import type { PayloadLoadResult } from '../../data/loader/index.js';
import type { ProjectReportDocument } from '../../types/index.js';
import type { ReportBootstrap, ReportLoadSource } from '../../types/report/index.js';
import { ReportBootstrapContext } from './bootstrap.js';

export function useReportBootstrap(): ReportBootstrap {
  const v = useContext(ReportBootstrapContext);
  if (!v) throw new Error('useReportBootstrap outside ReportProvider');
  return v;
}

export function useOptionalReport(): ProjectReportDocument | null {
  return useReportBootstrap().doc;
}

/** Section pages that require a loaded report document. */
export function useReport(): ProjectReportDocument {
  const doc = useReportBootstrap().doc;
  if (!doc) throw new Error('useReport requires a loaded report document');
  return doc;
}

/** @deprecated Use useReportBootstrap — session fields live on bootstrap. */
export function useReportSession(): {
  source: ReportLoadSource;
  workerReportId: string | null;
  remoteEvictionIssue: Issue | null;
  clearRemoteEvictionIssue: () => void;
  openSharedReport: (reportId: string) => void;
  bindWorkerReport: (reportId: string) => void;
  loadingRemote: boolean;
} {
  const b = useReportBootstrap();
  return {
    source: b.source,
    workerReportId: b.workerReportId,
    remoteEvictionIssue: b.remoteEvictionIssue,
    clearRemoteEvictionIssue: b.clearRemoteEvictionIssue,
    openSharedReport: b.openSharedReport,
    bindWorkerReport: b.bindWorkerReport,
    loadingRemote: b.phase === 'loading-remote',
  };
}

export function useReportImport(): {
  setDocFromRaw: (raw: string) => boolean;
  importError: PayloadLoadResult | null;
  clearImportError: () => void;
} {
  const b = useReportBootstrap();
  return {
    setDocFromRaw: b.setDocFromRaw,
    importError: b.importError,
    clearImportError: b.clearImportError,
  };
}
