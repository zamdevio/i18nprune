import { useContext } from 'react';
import type { PayloadLoadResult } from '../../data/loader/index.js';
import type { ProjectReportDocument } from '../../types/index.js';
import type { ReportBootstrap } from '../../types/report/index.js';
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
