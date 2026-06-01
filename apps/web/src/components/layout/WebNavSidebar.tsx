import { useEffect } from 'react';
import { Home, LayoutDashboard, Settings } from 'lucide-react';
import { EcosystemNavMenu } from './EcosystemNavMenu';
import { useAppRoute, navigateHash, navigateWorkspace } from '../../hooks/useAppRoute';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WebNavSidebar({ open, onClose }: Props): JSX.Element {
  const route = useAppRoute();
  const hashPath = route.path;

  const isActive = (path: string) =>
    hashPath === path || (path === '/' && (hashPath === '/' || hashPath === ''));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const go = (path: string): void => {
    navigateHash(path);
    onClose();
  };

  return (
    <>
      <div
        className={`runtime-nav-sidebar__backdrop${open ? ' is-open' : ''}`}
        role="presentation"
        onClick={onClose}
      />
      <aside
        className={`runtime-nav-sidebar${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        aria-label="Web navigation"
      >
        <div className="runtime-nav-sidebar__head">
          <span className="runtime-nav-sidebar__title">Menu</span>
          <button type="button" className="runtime-nav-sidebar__close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav className="runtime-nav-sidebar__app-nav" aria-label="Primary">
          <p className="runtime-nav-sidebar__group-label">Navigate</p>
          <div className="runtime-nav-sidebar__ecosystem">
            <EcosystemNavMenu />
          </div>
          <ul className="runtime-nav-sidebar__list">
            <li>
              <button
                type="button"
                className={`runtime-nav-sidebar__link${isActive('/') ? ' is-active' : ''}`}
                onClick={() => go('/')}
              >
                <Home size={16} aria-hidden /> Home
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`runtime-nav-sidebar__link${isActive('/workspace') ? ' is-active' : ''}`}
                onClick={() => {
                  navigateWorkspace();
                  onClose();
                }}
              >
                <LayoutDashboard size={16} aria-hidden /> Workspace
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`runtime-nav-sidebar__link${isActive('/settings') ? ' is-active' : ''}`}
                onClick={() => go('/settings')}
              >
                <Settings size={16} aria-hidden /> Settings
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
