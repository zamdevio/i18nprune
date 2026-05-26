import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Issue } from '@i18nprune/core';
import { PayloadErrorScreen } from '../../components/error/payload.js';
import { OpenSharedLinkPanel } from '../../components/open-shared-link/index.js';
import { PayloadImportPanel } from '../../components/payload-import/index.js';
import { WorkerUrlSettings } from '../../components/worker-settings/index.js';
import {
  loadPayloadResult,
  validatePayloadString,
  type PayloadLoadResult,
} from '../../data/loader/index.js';
import { readReportShareIdFromLocation } from '../../lib/share/parseReportShareId.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';
import { fetchWorkerReportDocument, fetchWorkerReportMetadata } from '../../worker/index.js';
import type { ProjectReportDocument } from '../../types/index.js';
import { EditorPreferenceProvider } from '../editor/index.js';
import { PaginationProvider } from '../pagination/index.js';
import { SearchProvider } from '../search/index.js';

export type ReportLoadSource = 'inline' | 'import' | 'worker';

const ReportContext = createContext<ProjectReportDocument | null>(null);

type LoaderState =
  | { phase: 'loading-remote'; reportId: string }
  | {
      phase: 'blocked';
      bootstrapError: PayloadLoadResult & { ok: false };
      importError: PayloadLoadResult | null;
      remoteIssue: Issue | null;
    }
  | {
      phase: 'ready';
      doc: ProjectReportDocument;
      source: ReportLoadSource;
      workerReportId: string | null;
      importError: PayloadLoadResult | null;
      remoteEvictionIssue: Issue | null;
    };

type ReportImportContextValue = {
  setDocFromRaw: (raw: string) => boolean;
  importError: PayloadLoadResult | null;
  clearImportError: () => void;
};

type ReportSessionContextValue = {
  source: ReportLoadSource;
  workerReportId: string | null;
  remoteEvictionIssue: Issue | null;
  clearRemoteEvictionIssue: () => void;
  openSharedReport: (reportId: string) => void;
  bindWorkerReport: (reportId: string) => void;
  loadingRemote: boolean;
};

const ReportImportContext = createContext<ReportImportContextValue | null>(null);
const ReportSessionContext = createContext<ReportSessionContextValue | null>(null);

function initialInlineState(urlReportId: string | null): LoaderState {
  if (urlReportId) {
    return { phase: 'loading-remote', reportId: urlReportId };
  }
  const r = loadPayloadResult();
  if (r.ok) {
    return { phase: 'ready', doc: r.doc, source: 'inline', workerReportId: null, importError: null, remoteEvictionIssue: null };
  }
  return { phase: 'blocked', bootstrapError: r, importError: null, remoteIssue: null };
}

export function ReportProvider({ children }: { children: ReactNode }): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlReportId = searchParams.get('id')?.trim() || readReportShareIdFromLocation();

  const [state, setState] = useState<LoaderState>(() => initialInlineState(urlReportId));
  const loadedRemoteIdRef = useRef<string | null>(urlReportId);

  const syncShareIdToUrl = useCallback(
    (reportId: string | null) => {
      const current = searchParams.get('id')?.trim() ?? '';
      const target = reportId?.trim() ?? '';
      if (current === target) return;
      navigate(
        { pathname: '/', search: target ? `?id=${encodeURIComponent(target)}` : '' },
        { replace: true },
      );
    },
    [navigate, searchParams],
  );

  const hydrateRemote = useCallback(async (reportId: string) => {
    loadedRemoteIdRef.current = reportId;
    setState({ phase: 'loading-remote', reportId });
    const workerBaseUrl = readWorkerUrl();
    const meta = await fetchWorkerReportMetadata(workerBaseUrl, reportId);
    if (!meta.ok) {
      setState({
        phase: 'blocked',
        bootstrapError: {
          ok: false,
          kind: 'schema',
          message: meta.issue.message,
          detail: meta.issue.code,
        },
        importError: null,
        remoteIssue: meta.issue,
      });
      return;
    }
    const docResult = await fetchWorkerReportDocument(workerBaseUrl, reportId);
    if (!docResult.ok) {
      setState({
        phase: 'blocked',
        bootstrapError: docResult,
        importError: null,
        remoteIssue: {
          severity: 'error',
          code: 'i18nprune.share.remote_error',
          message: docResult.message,
        },
      });
      return;
    }
    syncShareIdToUrl(reportId);
    setState({
      phase: 'ready',
      doc: docResult.doc,
      source: 'worker',
      workerReportId: reportId,
      importError: null,
      remoteEvictionIssue: null,
    });
  }, [syncShareIdToUrl]);

  useEffect(() => {
    if (!urlReportId) {
      loadedRemoteIdRef.current = null;
      return;
    }
    if (loadedRemoteIdRef.current === urlReportId) return;
    void hydrateRemote(urlReportId);
  }, [urlReportId, hydrateRemote]);

  const setDocFromRaw = useCallback(
    (raw: string): boolean => {
      const r = validatePayloadString(raw);
      if (r.ok) {
        syncShareIdToUrl(null);
        setState({
          phase: 'ready',
          doc: r.doc,
          source: 'import',
          workerReportId: null,
          importError: null,
          remoteEvictionIssue: null,
        });
        return true;
      }
      setState((prev) => {
        if (prev.phase === 'ready') return { ...prev, importError: r };
        return { ...prev, importError: r };
      });
      return false;
    },
    [syncShareIdToUrl],
  );

  const clearImportError = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'ready') return { ...prev, importError: null };
      return { ...prev, importError: null };
    });
  }, []);

  const openSharedReport = useCallback(
    (reportId: string) => {
      void hydrateRemote(reportId);
    },
    [hydrateRemote],
  );

  const bindWorkerReport = useCallback(
    (reportId: string) => {
      syncShareIdToUrl(reportId);
      setState((prev) => {
        if (prev.phase !== 'ready') return prev;
        return { ...prev, source: 'worker', workerReportId: reportId, remoteEvictionIssue: null };
      });
    },
    [syncShareIdToUrl],
  );

  const clearRemoteEvictionIssue = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'ready') return prev;
      return { ...prev, remoteEvictionIssue: null };
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

  const sessionValue = useMemo<ReportSessionContextValue>(() => {
    if (state.phase === 'ready') {
      return {
        source: state.source,
        workerReportId: state.workerReportId,
        remoteEvictionIssue: state.remoteEvictionIssue,
        clearRemoteEvictionIssue,
        openSharedReport,
        bindWorkerReport,
        loadingRemote: false,
      };
    }
    return {
      source: 'inline' as const,
      workerReportId: null,
      remoteEvictionIssue: null,
      clearRemoteEvictionIssue,
      openSharedReport,
      bindWorkerReport,
      loadingRemote: state.phase === 'loading-remote',
    };
  }, [state, clearRemoteEvictionIssue, openSharedReport, bindWorkerReport]);

  if (state.phase === 'loading-remote') {
    return (
      <div className="app-root app-root--centered">
        <p className="status-pill">Loading hosted report <code className="mono">{state.reportId}</code>…</p>
        <WorkerUrlSettings />
      </div>
    );
  }

  if (state.phase === 'blocked') {
    const e = state.bootstrapError;
    return (
      <PayloadErrorScreen kind={e.kind} message={e.message} detail={e.detail}>
        {state.remoteIssue ? (
          <p className="share-panel__error" role="alert">
            {state.remoteIssue.message}
          </p>
        ) : null}
        <OpenSharedLinkPanel onOpen={openSharedReport} />
        <WorkerUrlSettings />
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
        <ReportSessionContext.Provider value={sessionValue}>
          <EditorPreferenceProvider>
            <SearchProvider>
              <PaginationProvider>{children}</PaginationProvider>
            </SearchProvider>
          </EditorPreferenceProvider>
        </ReportSessionContext.Provider>
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

export function useReportSession(): ReportSessionContextValue {
  const v = useContext(ReportSessionContext);
  if (!v) throw new Error('useReportSession outside ReportSessionContext');
  return v;
}
