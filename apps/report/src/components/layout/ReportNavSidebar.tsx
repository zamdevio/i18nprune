import { useEffect } from 'react';
import { Home, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { EcosystemNavMenu } from '@i18nprune/ui/react/nav';
import { REPORT_ECOSYSTEM_NAV_LINKS } from '../../constants/ecosystemSurfaces.js';
import { EditorPreferenceDropdown } from '../editor/index.js';
import { ReportSectionsMenu } from './ReportSectionsMenu.js';
import { ReportWorkspaceNav } from './ReportWorkspaceNav.js';

type Props = {
  open: boolean;
  onClose: () => void;
  hasDoc: boolean;
};

export function ReportNavSidebar({ open, onClose, hasDoc }: Props): JSX.Element {
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

  return (
    <>
      <div
        className={`report-nav-sidebar__backdrop${open ? ' is-open' : ''}`}
        role="presentation"
        onClick={onClose}
      />
      <aside
        className={`report-nav-sidebar${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        aria-label="Report navigation"
      >
        <div className="report-nav-sidebar__head">
          <span className="report-nav-sidebar__title">Menu</span>
          <span className="report-nav-sidebar__shortcut muted">Ctrl+B</span>
          <button type="button" className="report-nav-sidebar__close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav className="report-nav-sidebar__app-nav" aria-label="Primary">
          <p className="report-nav-sidebar__group-label">Navigate</p>
          <div className="report-nav-sidebar__ecosystem">
            <EcosystemNavMenu links={REPORT_ECOSYSTEM_NAV_LINKS} />
          </div>
          <ul className="report-nav-sidebar__list">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `report-nav-sidebar__link${isActive ? ' is-active' : ''}`
                }
                onClick={onClose}
              >
                <Home size={16} aria-hidden /> Home
              </NavLink>
            </li>
            <li className="report-nav-sidebar__workspace">
              <ReportWorkspaceNav hasDoc={hasDoc} layout="sidebar" />
            </li>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `report-nav-sidebar__link${isActive ? ' is-active' : ''}`
                }
                onClick={onClose}
              >
                <Settings size={16} aria-hidden /> Settings
              </NavLink>
            </li>
          </ul>
        </nav>

        {hasDoc ? <ReportSectionsMenu onNavigate={onClose} /> : null}

        <div className="report-nav-sidebar__editor">
          <p className="report-nav-sidebar__group-label">Editor</p>
          <EditorPreferenceDropdown layout="sidebar" />
        </div>
      </aside>
    </>
  );
}
