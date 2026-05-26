import { useEffect, useState } from 'react';
import { Home, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { EcosystemNavMenu } from '@i18nprune/ui/react/nav';
import { ReportBrandIcon } from '../brand/ReportBrandIcon.js';
import { EditorPreferenceDropdown } from '../editor/index.js';
import { REPORT_ECOSYSTEM_NAV_LINKS } from '../../constants/ecosystemSurfaces.js';
import { REPORT_SHELL_BRAND } from '../../constants/brand.js';
import { useCompactReportHeader } from '../../hooks/useCompactReportHeader.js';
import { useOptionalReport, useReportBootstrap } from '../../context/report/hooks.js';
import { ThemeToggle } from '../ThemeToggle.js';
import { ReportNavSidebar } from './ReportNavSidebar.js';
import { ReportWorkspaceNav } from './ReportWorkspaceNav.js';

export function RuntimeHeader(): JSX.Element {
  const location = useLocation();
  const doc = useOptionalReport();
  const bootstrap = useReportBootstrap();
  const hasDoc = bootstrap.phase === 'ready' && doc !== null;
  const compactNav = useCompactReportHeader();
  const [menuOpen, setMenuOpen] = useState(false);

  const homeActive = location.pathname === '/' || location.pathname === '';
  useEffect(() => {
    if (!compactNav) setMenuOpen(false);
  }, [compactNav]);

  useEffect(() => {
    if (!compactNav) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'b' || !(e.ctrlKey || e.metaKey)) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      setMenuOpen((open) => !open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compactNav]);

  return (
    <>
      <header className="runtime-header">
        <div className="runtime-header__inner">
          <div className="runtime-header__cluster">
            {compactNav ?
              <button
                type="button"
                className="report-header-menu-btn"
                aria-label="Open navigation menu (Ctrl+B)"
                aria-expanded={menuOpen}
                aria-keyshortcuts="Control+B"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="report-header-menu-btn__bar" aria-hidden />
                <span className="report-header-menu-btn__bar" aria-hidden />
                <span className="report-header-menu-btn__bar" aria-hidden />
              </button>
            : null}
            <NavLink to="/" className="runtime-header__brand runtime-header__brand--report" end>
              <ReportBrandIcon />
              <span className="runtime-header__brand-text">
                <span className="runtime-header__title">{REPORT_SHELL_BRAND}</span>
                <span className="runtime-header__subtitle">Report runtime</span>
              </span>
            </NavLink>
          </div>

          {!compactNav ?
            <nav className="runtime-header__nav" aria-label="Primary">
              <EcosystemNavMenu links={REPORT_ECOSYSTEM_NAV_LINKS} />
              <NavLink
                to="/"
                end
                className={`runtime-header__nav-link${homeActive ? ' is-active' : ''}`}
              >
                <Home size={16} aria-hidden />
                <span className="runtime-header__nav-label">Home</span>
              </NavLink>
              <ReportWorkspaceNav hasDoc={hasDoc} />
            </nav>
          : null}

          <div className="runtime-header__actions">
            {!compactNav ?
              <div className="report-header-editor">
                <EditorPreferenceDropdown layout="header" />
              </div>
            : null}
            <ThemeToggle />
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `runtime-header__icon-btn${isActive ? ' is-active' : ''}`
              }
              aria-label="Settings"
            >
              <Settings size={18} />
            </NavLink>
          </div>
        </div>
        {bootstrap.remoteEvictionIssue ?
          <div className="share-eviction-banner runtime-header__banner" role="alert">
            <p>{bootstrap.remoteEvictionIssue.message}</p>
            <button type="button" className="btn-secondary" onClick={bootstrap.clearRemoteEvictionIssue}>
              Dismiss
            </button>
          </div>
        : null}
      </header>

      {compactNav ?
        <ReportNavSidebar open={menuOpen} onClose={() => setMenuOpen(false)} hasDoc={hasDoc} />
      : null}
    </>
  );
}
