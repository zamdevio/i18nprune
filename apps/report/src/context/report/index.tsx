import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ProjectReportDocument } from '../../types/index.js';
import { PayloadErrorScreen } from '../../components/error/payload.js';
import { PayloadImportPanel } from '../../components/payload-import/index.js';
import { loadPayloadResult, validatePayloadString, type PayloadLoadResult } from '../../data/loader/index.js';
import { EditorPreferenceProvider } from '../editor/index.js';
import { PaginationProvider } from '../pagination/index.js';
import { SearchProvider } from '../search/index.js';

const ReportContext = createContext<ProjectReportDocument | null>(null);

type LoaderState =
  | { phase: 'blocked'; bootstrapError: PayloadLoadResult & { ok: false }; importError: PayloadLoadResult | null }
  | { phase: 'ready'; doc: ProjectReportDocument; importError: PayloadLoadResult | null };

type ReportImportContextValue = {
  /** Returns `true` if JSON validated and the report was replaced. */
  setDocFromRaw: (raw: string) => boolean;
  importError: PayloadLoadResult | null;
  clearImportError: () => void;
};

const ReportImportContext = createContext<ReportImportContextValue | null>(null);

function initialState(): LoaderState {
  const r = loadPayloadResult();
  if (r.ok) return { phase: 'ready', doc: r.doc, importError: null };
  return { phase: 'blocked', bootstrapError: r, importError: null };
}

export function ReportProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<LoaderState>(initialState);

  const setDocFromRaw = useCallback((raw: string): boolean => {
    const r = validatePayloadString(raw);
    if (r.ok) {
      setState({ phase: 'ready', doc: r.doc, importError: null });
      return true;
    }
    setState((prev) => {
      if (prev.phase === 'ready') return { ...prev, importError: r };
      return { ...prev, importError: r };
    });
    return false;
  }, []);

  const clearImportError = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'ready') return { ...prev, importError: null };
      return { ...prev, importError: null };
    });
  }, []);

  const importValue = useMemo<ReportImportContextValue>(
    () => ({
      setDocFromRaw,
      importError: state.phase === 'ready' ? state.importError : null,
      clearImportError,
    }),
    [setDocFromRaw, clearImportError, state],
  );

  if (state.phase === 'blocked') {
    const e = state.bootstrapError;
    return (
      <PayloadErrorScreen kind={e.kind} message={e.message} detail={e.detail}>
        <PayloadImportPanel
          onApply={setDocFromRaw}
          error={state.importError}
          onClearError={clearImportError}
          defaultOpen
        />
      </PayloadErrorScreen>
    );
  }

  return (
    <ReportContext.Provider value={state.doc}>
      <ReportImportContext.Provider value={importValue}>
        <EditorPreferenceProvider>
          <SearchProvider>
            <PaginationProvider>{children}</PaginationProvider>
          </SearchProvider>
        </EditorPreferenceProvider>
      </ReportImportContext.Provider>
    </ReportContext.Provider>
  );
}

export function useReport(): ProjectReportDocument {
  const v = useContext(ReportContext);
  if (!v) throw new Error('useReport outside ReportProvider');
  return v;
}

export function useReportImport(): ReportImportContextValue {
  const v = useContext(ReportImportContext);
  if (!v) throw new Error('useReportImport outside ReportImportContext');
  return v;
}
