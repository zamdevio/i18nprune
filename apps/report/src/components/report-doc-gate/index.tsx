import { Link, Navigate, Outlet } from 'react-router-dom';
import { PayloadErrorScreen } from '../error/payload.js';
import { ReportImportPanel } from '../report-import/index.js';
import { useReportBootstrap } from '../../context/report/hooks.js';

export function ReportDocGate(): JSX.Element {
  const bootstrap = useReportBootstrap();

  if (bootstrap.phase === 'loading-remote') {
    return (
      <div className="page-panel report-loading-panel" role="status" aria-live="polite">
        <div className="report-loading-panel__spinner" aria-hidden />
        <p className="report-loading-panel__title">Loading hosted report</p>
        <p className="report-loading-panel__id mono">{bootstrap.loadingReportId}</p>
        <p className="muted report-loading-panel__hint">Fetching from your configured worker…</p>
      </div>
    );
  }

  if (bootstrap.phase === 'blocked') {
    const e = bootstrap.bootstrapError!;
    return (
      <PayloadErrorScreen kind={e.kind} message={e.message} detail={e.detail}>
        {bootstrap.remoteIssue ?
          <p className="share-panel__error" role="alert">
            {bootstrap.remoteIssue.message}
          </p>
        : null}
        <p className="muted">
          Or return <Link to="/">home</Link> to import a report, and open <Link to="/settings">Settings</Link> to
          configure the worker.
        </p>
        <ReportImportPanel defaultPasteOpen />
      </PayloadErrorScreen>
    );
  }

  if (!bootstrap.doc) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
