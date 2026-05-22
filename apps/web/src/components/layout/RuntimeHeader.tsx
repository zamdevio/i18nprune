import { Home, LayoutDashboard, Moon, Settings, Sun } from 'lucide-react';
import { useAppRoute, navigateHash, navigateWorkspace } from '../../hooks/useAppRoute';
import { useTheme } from '../../context/ThemeContext';
import { EcosystemNavMenu } from './EcosystemNavMenu';

export function RuntimeHeader() {
  const route = useAppRoute();
  const hashPath = route.path;
  const { theme, toggleTheme } = useTheme();

  const nav = (path: string) => {
    navigateHash(path);
  };

  const isActive = (path: string) =>
    hashPath === path || (path === '/' && (hashPath === '/' || hashPath === ''));

  return (
    <header className="runtime-header">
      <div className="runtime-header__inner">
        <div className="runtime-header__cluster">
          <img className="runtime-header__logo" src="/i18nprune.svg" alt="" width={32} height={32} aria-hidden />
          <button type="button" className="runtime-header__brand" onClick={() => nav('/')}>
            <span className="runtime-header__title">i18nprune</span>
            <span className="runtime-header__subtitle">Web Runtime</span>
          </button>
        </div>

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
  );
}
