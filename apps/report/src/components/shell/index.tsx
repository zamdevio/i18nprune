import type { ReactNode } from 'react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PayloadImportPanel } from '../payload-import/index.js';
import { OpenSharedLinkPanel } from '../open-shared-link/index.js';
import { ShareReportButton } from '../share-report/index.js';
import { WorkerUrlSettings } from '../worker-settings/index.js';
import { useReport, useReportImport, useReportSession } from '../../context/report/index.js';
import { REPORT_SHELL_BRAND } from '../../constants/brand.js';
import { getDocsUrl, GITHUB_BASE, GITHUB_REPO } from '@i18nprune/core';
import { ThemeToggle } from '../ThemeToggle.js';
import { ReportSearchBar } from '../search/index.js';
import { EditorPreferenceDropdown } from '../editor/index.js';

const nav = [
  { to: '/', label: 'Overview' },
  { to: '/missing', label: 'Missing keys' },
  { to: '/dynamic', label: 'Dynamic sites' },
  { to: '/observations', label: 'Observations' },
  { to: '/heatmap', label: 'Hotspots' },
  { to: '/namespaces', label: 'Namespaces' },
];

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const doc = useReport();
  const { setDocFromRaw, importError, clearImportError } = useReportImport();
  const { source, workerReportId, remoteEvictionIssue, clearRemoteEvictionIssue, openSharedReport } =
    useReportSession();
  const loc = useLocation();
  const [importOpen, setImportOpen] = useState(false);
  const [sharedOpen, setSharedOpen] = useState(false);

  return (
    <div className="app-root">
      <header className="app-header app-header--stack">
        <div className="app-header-row">
          <div className="app-brand app-brand-row">
            <strong>{REPORT_SHELL_BRAND}</strong>
            <span className="badge-version" title="CLI version embedded in this report">
              v{doc.toolVersion}
            </span>
            <span className="app-brand__meta" title="Report generation date">
              {doc.generatedAt}
            </span>
          </div>
          <div className="app-actions">
            <ShareReportButton doc={doc} source={source} workerReportId={workerReportId} />
            <button type="button" className="btn-secondary" onClick={() => setSharedOpen((o) => !o)}>
              {sharedOpen ? 'Hide open link' : 'Open shared link'}
            </button>
            <ThemeToggle />
            <span className="badge" title="Current hash route">
              #{loc.pathname === '/' ? '/' : loc.pathname.replace(/^\//, '')}
            </span>
            {source === 'worker' && workerReportId ?
              <span className="badge" title="Loaded from hosted worker">
                hosted · <code className="mono">{workerReportId}</code>
              </span>
            : null}
          </div>
        </div>
        <div className="app-header-row app-header-row--toolbar">
          <ReportSearchBar />
          <EditorPreferenceDropdown />
        </div>
        {remoteEvictionIssue ?
          <div className="share-eviction-banner" role="alert">
            <p>{remoteEvictionIssue.message}</p>
            <button type="button" className="btn-secondary" onClick={clearRemoteEvictionIssue}>
              Dismiss
            </button>
          </div>
        : null}
        {sharedOpen ?
          <OpenSharedLinkPanel
            onOpen={(id) => {
              openSharedReport(id);
              setSharedOpen(false);
            }}
          />
        : null}
        <nav className={`app-nav${importOpen ? ' app-nav--import-mode' : ''}`} aria-label="Report sections">
          {!importOpen ?
            <>
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
              <button type="button" className="nav-link nav-link--import" onClick={() => setImportOpen(true)}>
                Import Project Report
              </button>
            </>
          : <PayloadImportPanel
              shell={{ open: true, onClose: () => setImportOpen(false) }}
              onApply={setDocFromRaw}
              error={importError}
              onClearError={clearImportError}
            />}
        </nav>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <WorkerUrlSettings />
        <div className="app-footer__links">
          <a href={getDocsUrl('commands/report')} target="_blank" rel="noreferrer">
            Report command
          </a>
          <span className="app-footer__sep" aria-hidden>
            ·
          </span>
          <a href={getDocsUrl()} target="_blank" rel="noreferrer">
            Documentation
          </a>
          <span className="app-footer__sep" aria-hidden>
            ·
          </span>
          <a href={GITHUB_BASE} target="_blank" rel="noreferrer">
            {GITHUB_REPO} on GitHub
          </a>
        </div>
        <p className="app-footer__note">
          Offline HTML · routes use <code className="mono">#/</code> (hash) so navigation stays inside this file.
        </p>
      </footer>
    </div>
  );
}
