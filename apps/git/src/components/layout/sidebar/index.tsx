import { NavLink } from 'react-router-dom';
import { GitCommit, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './index.module.css';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  icon: ReactNode;
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  isCompact: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
  items: readonly NavItem[];
}

export function Sidebar({
  collapsed,
  mobileOpen,
  isCompact,
  onToggle,
  onCloseMobile,
  items,
}: SidebarProps) {
  const showOverlay = isCompact && mobileOpen;
  const railCollapsed = !isCompact && collapsed;
  const ToggleIcon = railCollapsed || (isCompact && !mobileOpen) ? PanelLeftOpen : PanelLeftClose;

  return (
    <>
      {showOverlay ?
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close navigation"
          onClick={onCloseMobile}
        />
      : null}

      <nav
        className={[
          styles.nav,
          railCollapsed ? styles.navCollapsed : '',
          isCompact ? styles.navCompact : '',
          isCompact && mobileOpen ? styles.navCompactOpen : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="Main navigation"
        aria-hidden={isCompact && !mobileOpen}
      >
        <div className={styles.head}>
          <div className={styles.brand}>
            <img className={styles.logo} src="/i18nprune.svg" alt="" width={28} height={28} />
            {!railCollapsed ?
              <div className={styles.brandText}>
                <span className={styles.brandTitle}>i18nprune</span>
                <span className={styles.brandSubtitle}>git analytics</span>
              </div>
            : null}
          </div>
        </div>

        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                title={railCollapsed ? item.label : undefined}
                onClick={isCompact ? onCloseMobile : undefined}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.linkActive : ''}`
                }
              >
                <span className={styles.linkIcon} aria-hidden>
                  {item.icon}
                </span>
                <span className={styles.linkLabel}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          {!railCollapsed && !isCompact ?
            <span className={styles.shortcut} aria-hidden>
              Ctrl+B
            </span>
          : null}
          <button
            type="button"
            className={styles.toggle}
            onClick={onToggle}
            aria-label={
              isCompact ?
                mobileOpen ?
                  'Close sidebar (Ctrl+B)'
                : 'Open sidebar (Ctrl+B)'
              : collapsed ?
                'Expand sidebar (Ctrl+B)'
              : 'Collapse sidebar (Ctrl+B)'
            }
            aria-keyshortcuts="Control+B"
            aria-expanded={isCompact ? mobileOpen : !collapsed}
          >
            <ToggleIcon className={styles.toggleIcon} strokeWidth={2} aria-hidden />
            {!railCollapsed && !isCompact ?
              <span className={styles.toggleLabel}>Collapse</span>
            : null}
          </button>
        </div>
      </nav>
    </>
  );
}

export type { NavItem };
