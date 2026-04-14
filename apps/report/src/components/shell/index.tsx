import type { ReactNode } from 'react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PayloadImportPanel } from '../payload-import/index.js';
import { useReport, useReportImport } from '../../context/report/index.js';
import { REPORT_SHELL_BRAND } from '../../constants/brand.js';
import { getDocsUrl, GITHUB_BASE, GITHUB_REPO } from '../../lib/docs.js';
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
  const loc = useLocation();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="app-root">
      <header className="app-header app-header--stack">
        <div className="app-header-row">
          <div className="app-brand app-brand-row">
            <strong>{REPORT_SHELL_BRAND}</strong>
            <span className="badge-version" title="CLI version embedded in this report">
              v{doc.toolVersion}
            </span>
            <span className="app-brand__meta">{doc.generatedAt}</span>
          </div>
          <div className="app-actions">
            <ThemeToggle />
            <span className="badge" title="Current hash route">
              #{loc.pathname === '/' ? '/' : loc.pathname.replace(/^\//, '')}
            </span>
          </div>
        </div>
        <div className="app-header-row app-header-row--toolbar">
          <ReportSearchBar />
          <EditorPreferenceDropdown />
        </div>
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
                Import JSON
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
