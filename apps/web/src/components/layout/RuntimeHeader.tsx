import { useEffect, useState } from 'react';
import { Home, LayoutDashboard, Moon, Settings, Sun } from 'lucide-react';
import { useAppRoute, navigateHash, navigateWorkspace } from '../../hooks/useAppRoute';
import { useCompactRuntimeHeader } from '../../hooks/useCompactRuntimeHeader';
import { useTheme } from '@i18nprune/ui/react/theme';
import { EcosystemNavMenu } from './EcosystemNavMenu';
import { WebNavSidebar } from './WebNavSidebar';

export function RuntimeHeader() {
  const route = useAppRoute();
  const hashPath = route.path;
  const { theme, toggleTheme } = useTheme();
  const compactNav = useCompactRuntimeHeader();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (path: string) => {
    navigateHash(path);
  };

  const isActive = (path: string) =>
    hashPath === path || (path === '/' && (hashPath === '/' || hashPath === ''));

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
                className="runtime-header-menu-btn"
                aria-label="Open navigation menu (Ctrl+B)"
                aria-expanded={menuOpen}
                aria-keyshortcuts="Control+B"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="runtime-header-menu-btn__bar" aria-hidden />
                <span className="runtime-header-menu-btn__bar" aria-hidden />
                <span className="runtime-header-menu-btn__bar" aria-hidden />
              </button>
            : null}
            <img className="runtime-header__logo" src="/i18nprune.svg" alt="" width={32} height={32} aria-hidden />
            <button type="button" className="runtime-header__brand" onClick={() => nav('/')}>
              <span className="runtime-header__title">i18nprune</span>
              <span className="runtime-header__subtitle">Web Runtime</span>
            </button>
          </div>

          {!compactNav ?
            <nav className="runtime-header__nav" aria-label="Primary">
              <EcosystemNavMenu />
              <button
                type="button"
                className={`runtime-header__nav-link${isActive('/') ? ' is-active' : ''}`}
                onClick={() => nav('/')}
              >
                <Home size={16} aria-hidden />
                <span className="runtime-header__nav-label">Home</span>
              </button>
              <button
                type="button"
                className={`runtime-header__nav-link${isActive('/workspace') ? ' is-active' : ''}`}
                onClick={() => navigateWorkspace()}
              >
                <LayoutDashboard size={16} aria-hidden />
                <span className="runtime-header__nav-label">Workspace</span>
              </button>
            </nav>
          : null}

          <div className="runtime-header__actions">
            <button
              type="button"
              className="runtime-header__icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="runtime-header__icon-btn"
              onClick={() => nav('/settings')}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {compactNav ?
        <WebNavSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      : null}
    </>
  );
}
