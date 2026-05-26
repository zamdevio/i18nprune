import { Outlet } from 'react-router-dom';
import { getDocsUrl, GITHUB_BASE, GITHUB_REPO } from '@i18nprune/core';
import { RuntimeHeader } from '../layout/RuntimeHeader.js';

export function AppShell(): JSX.Element {
  return (
    <div className="app-root report-app-root">
      <RuntimeHeader />
      <main className="app-main page-shell-main">
        <Outlet />
      </main>
      <footer className="app-footer report-app-footer">
        <div className="report-app-footer__inner">
          <div className="app-footer__links">
            <a href={getDocsUrl('commands/report')} target="_blank" rel="noreferrer">
              Report command
            </a>
            <span className="app-footer__sep" aria-hidden>
              ·
            </span>
            <a href={getDocsUrl('commands/share/README')} target="_blank" rel="noreferrer">
              Share
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
              {GITHUB_REPO}
            </a>
          </div>
          <p className="app-footer__note muted">
            Offline HTML · hash routes (<code className="mono">#/</code>, <code className="mono">#/settings</code>) keep
            navigation inside this file.
          </p>
        </div>
      </footer>
    </div>
  );
}
