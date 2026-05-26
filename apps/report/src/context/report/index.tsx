import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Issue } from '@i18nprune/core';
import {
  hasEmbeddedReportPayload,
  loadPayloadResult,
  validatePayloadString,
  type PayloadLoadResult,
} from '../../data/loader/index.js';
import { readReportShareIdFromLocation } from '../../lib/share/parseReportShareId.js';
import { buildHostedReportShareUrl } from '../../lib/share/reportShareUrl.js';
import { recordShareHistory } from '../../storage/shareHistory.js';
import { readWorkerUrl } from '../../storage/workerUrl.js';
import { toast } from '@i18nprune/ui/react/feedback';
import { fetchWorkerReportDocument, fetchWorkerReportMetadata } from '../../worker/index.js';
import type { ProjectReportDocument } from '../../types/index.js';
import { PaginationProvider } from '../pagination/index.js';
import { SearchProvider } from '../search/index.js';
import type { ReportBootstrap, ReportLoadSource } from '../../types/report/index.js';
import { ReportBootstrapContext } from './bootstrap.js';

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

function initialInlineState(urlReportId: string | null): LoaderState {
  if (urlReportId) {
    return { phase: 'loading-remote', reportId: urlReportId };
  }
  if (!hasEmbeddedReportPayload()) {
    return {
      phase: 'blocked',
      bootstrapError: {
        ok: false,
        kind: 'missing',
        message: 'No report loaded yet.',
        detail: 'Import JSON, open a hosted link, or drop a project zip on the home page.',
      },
      importError: null,
      remoteIssue: null,
    };
  }
  const r = loadPayloadResult();
  if (r.ok) {
    return {
      phase: 'ready',
      doc: r.doc,
      source: 'inline',
      workerReportId: null,
      importError: null,
      remoteEvictionIssue: null,
    };
  }
  return { phase: 'blocked', bootstrapError: r, importError: null, remoteIssue: null };
}

function rememberShareActivity(input: {
  reportId: string;
  activity: 'viewed' | 'shared';
  doc?: ProjectReportDocument;
}): void {
  const workerBaseUrl = readWorkerUrl();
  recordShareHistory({
    reportId: input.reportId,
    workerBaseUrl,
    activity: input.activity,
    shareUrl: buildHostedReportShareUrl(input.reportId),
    toolVersion: input.doc?.toolVersion,
    generatedAt: input.doc?.generatedAt,
  });
}

export function ReportProvider({ children }: { children: ReactNode }): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlReportId = searchParams.get('id')?.trim() || readReportShareIdFromLocation();

  const [state, setState] = useState<LoaderState>(() => initialInlineState(urlReportId));

  const syncShareIdToUrl = useCallback(
    (reportId: string | null) => {
      const current = searchParams.get('id')?.trim() ?? '';
      const target = reportId?.trim() ?? '';
      if (current === target) return;
      navigate(
        {
          pathname: location.pathname,
          search: target ? `?id=${encodeURIComponent(target)}` : '',
        },
        { replace: true },
      );
    },
    [location.pathname, navigate, searchParams],
  );

  const hydrateRemote = useCallback(
    async (reportId: string) => {
      setState({ phase: 'loading-remote', reportId });
      const workerBaseUrl = readWorkerUrl();
      const meta = await fetchWorkerReportMetadata(workerBaseUrl, reportId);
      if (!meta.ok) {
        toast.error(meta.issue.message);
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
        toast.error(docResult.message);
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
      rememberShareActivity({ reportId, activity: 'viewed', doc: docResult.doc });
      const versionLabel = docResult.doc.toolVersion ? ` (${docResult.doc.toolVersion})` : '';
      toast.success(`Report loaded${versionLabel}`);
      setState({
        phase: 'ready',
        doc: docResult.doc,
        source: 'worker',
        workerReportId: reportId,
        importError: null,
        remoteEvictionIssue: null,
      });
      navigate(
        { pathname: '/overview', search: `?id=${encodeURIComponent(reportId)}` },
        { replace: true },
      );
    },
    [navigate, syncShareIdToUrl],
  );

  useEffect(() => {
    if (!urlReportId) return;
    void hydrateRemote(urlReportId);
  }, [urlReportId, hydrateRemote]);

  useEffect(() => {
    if (state.phase !== 'ready' || state.source !== 'inline' || !hasEmbeddedReportPayload()) return;
    if (location.pathname !== '/') return;
    navigate('/overview', { replace: true });
  }, [state, location.pathname, navigate]);

  const setDocFromRaw = useCallback(
    (raw: string): boolean => {
      const r = validatePayloadString(raw);
      if (r.ok) {
        syncShareIdToUrl(null);
        const versionLabel = r.doc.toolVersion ? ` (${r.doc.toolVersion})` : '';
        toast.success(`Report imported${versionLabel}`);
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
        if (prev.phase === 'blocked') return { ...prev, importError: r };
        return prev;
      });
      return false;
    },
    [syncShareIdToUrl],
  );

  const clearImportError = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'ready') return { ...prev, importError: null };
      if (prev.phase === 'blocked') return { ...prev, importError: null };
      return prev;
    });
  }, []);

  const openSharedReport = useCallback(
    (reportId: string) => {
      rememberShareActivity({ reportId, activity: 'viewed' });
      void hydrateRemote(reportId);
    },
    [hydrateRemote],
  );

  const bindWorkerReport = useCallback((reportId: string) => {
    setState((prev) => {
      if (prev.phase !== 'ready') return prev;
      rememberShareActivity({ reportId, activity: 'shared', doc: prev.doc });
      return { ...prev, workerReportId: reportId, remoteEvictionIssue: null };
    });
  }, []);

  const clearWorkerBinding = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'ready') return prev;
      return { ...prev, workerReportId: null, remoteEvictionIssue: null };
    });
  }, []);

  const setDocFromDocument = useCallback(
    (doc: ProjectReportDocument) => {
      syncShareIdToUrl(null);
      const versionLabel = doc.toolVersion ? ` (${doc.toolVersion})` : '';
      toast.success(`Report loaded${versionLabel}`);
      setState({
        phase: 'ready',
        doc,
        source: 'import',
        workerReportId: null,
        importError: null,
        remoteEvictionIssue: null,
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

  const evictHostedReport = useCallback(() => {
    syncShareIdToUrl(null);
    setState({
      phase: 'blocked',
      bootstrapError: {
        ok: false,
        kind: 'schema',
        message: 'This report is no longer on the worker.',
        detail: 'removed',
      },
      importError: null,
      remoteIssue: null,
    });
  }, [syncShareIdToUrl]);

  const clearReportSession = useCallback(() => {
    syncShareIdToUrl(null);
    navigate('/');
    setState({
      phase: 'blocked',
      bootstrapError: {
        ok: false,
        kind: 'missing',
        message: 'No report loaded yet.',
        detail: 'Import JSON, open a hosted link, or drop a project zip on the home page.',
      },
      importError: null,
      remoteIssue: null,
    });
  }, [navigate, syncShareIdToUrl]);

  const bootstrap = useMemo((): ReportBootstrap => {
    if (state.phase === 'loading-remote') {
      return {
        phase: 'loading-remote',
        doc: null,
        source: 'inline',
        workerReportId: null,
        loadingReportId: state.reportId,
        bootstrapError: null,
        remoteIssue: null,
        importError: null,
        remoteEvictionIssue: null,
        setDocFromRaw,
        clearImportError,
        openSharedReport,
        bindWorkerReport,
        clearWorkerBinding,
        setDocFromDocument,
        clearRemoteEvictionIssue,
        evictHostedReport,
        clearReportSession,
      };
    }
    if (state.phase === 'blocked') {
      return {
        phase: 'blocked',
        doc: null,
        source: 'inline',
        workerReportId: null,
        loadingReportId: null,
        bootstrapError: state.bootstrapError,
        remoteIssue: state.remoteIssue,
        importError: state.importError,
        remoteEvictionIssue: null,
        setDocFromRaw,
        clearImportError,
        openSharedReport,
        bindWorkerReport,
        clearWorkerBinding,
        setDocFromDocument,
        clearRemoteEvictionIssue,
        evictHostedReport,
        clearReportSession,
      };
    }
    return {
      phase: 'ready',
      doc: state.doc,
      source: state.source,
      workerReportId: state.workerReportId,
      loadingReportId: null,
      bootstrapError: null,
      remoteIssue: null,
      importError: state.importError,
      remoteEvictionIssue: state.remoteEvictionIssue,
      setDocFromRaw,
      clearImportError,
      openSharedReport,
      bindWorkerReport,
      clearWorkerBinding,
      setDocFromDocument,
      clearRemoteEvictionIssue,
      evictHostedReport,
      clearReportSession,
    };
  }, [
    state,
    setDocFromRaw,
    clearImportError,
    openSharedReport,
    bindWorkerReport,
    clearWorkerBinding,
    setDocFromDocument,
    clearRemoteEvictionIssue,
    evictHostedReport,
    clearReportSession,
  ]);

  const docReady = state.phase === 'ready';

  return (
    <ReportBootstrapContext.Provider value={bootstrap}>
      {docReady ?
        <ReportDocumentProviders>{children}</ReportDocumentProviders>
      : children}
    </ReportBootstrapContext.Provider>
  );
}

function ReportDocumentProviders({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SearchProvider>
      <PaginationProvider>{children}</PaginationProvider>
    </SearchProvider>
  );
}
