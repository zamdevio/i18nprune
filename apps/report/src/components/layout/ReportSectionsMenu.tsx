import { NavLink } from 'react-router-dom';
import { reportSectionNav } from '../../constants/reportNav.js';

type Props = {
  onNavigate?: () => void;
};

/** Sidebar-only section list (wide header uses ReportWorkspaceNav). */
export function ReportSectionsMenu({ onNavigate }: Props): JSX.Element {
  return (
    <nav className="report-nav-sidebar__section-nav" aria-label="Report sections">
      <p className="report-nav-sidebar__group-label">Report sections</p>
      <ul className="report-nav-sidebar__list">
        {reportSectionNav.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                `report-nav-sidebar__link${isActive ? ' is-active' : ''}`
              }
              onClick={onNavigate}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
