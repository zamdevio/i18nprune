import { STREAM_IDS, STREAM_META } from '@/features/catalog/streams';
import {
  BookOpen,
  ExternalLink,
  Github,
  GitCompare,
  Globe,
  Home,
  Search,
} from 'lucide-react';
import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';

const ECOSYSTEM_LINKS = [
  { label: 'Product', href: 'https://i18nprune.dev', icon: Globe },
  { label: 'Docs', href: 'https://docs.i18nprune.dev', icon: BookOpen },
  { label: 'GitHub', href: 'https://github.com/zamdevio/i18nprune', icon: Github },
] as const;

type HeaderNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function NavSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-2 shadow-sm">
      <h2 className="px-2.5 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

function DrawerLink({
  to,
  onClick,
  active,
  icon: Icon,
  children,
}: {
  to: string;
  onClick: () => void;
  active: boolean;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-accent text-foreground'
          : 'text-foreground/85 hover:bg-accent/60 hover:text-foreground'
      }`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-75" /> : null}
      {children}
    </Link>
  );
}

export default function HeaderNavDrawer({ open, onClose }: HeaderNavDrawerProps) {
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : path === '/search'
        ? location.pathname === '/search'
        : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 top-14 z-[60] bg-black/45 nav-wide:hidden"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className="header-nav-drawer fixed left-0 right-0 top-14 z-[70] max-h-[min(32rem,calc(100vh-3.5rem))] overflow-y-auto border-b border-border bg-background shadow-lg nav-wide:hidden"
        role="dialog"
        aria-label="Site navigation"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 p-4">
          <NavSection title="Portal">
            <DrawerLink to="/" onClick={onClose} active={isActive('/')} icon={Home}>
              Overview
            </DrawerLink>
            <DrawerLink
              to="/search"
              onClick={onClose}
              active={isActive('/search')}
              icon={Search}
            >
              Search
            </DrawerLink>
          </NavSection>

          <NavSection title="Release streams">
            {STREAM_IDS.map((id) => (
              <DrawerLink
                key={id}
                to={`/${id}`}
                onClick={onClose}
                active={isActive(`/${id}`)}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${STREAM_META[id].bgClass}`}
                  aria-hidden
                />
                {STREAM_META[id].label}
              </DrawerLink>
            ))}
          </NavSection>

          <NavSection title="Compare versions">
            {STREAM_IDS.map((id) => (
              <DrawerLink
                key={`compare-${id}`}
                to={`/compare/${id}`}
                onClick={onClose}
                active={location.pathname === `/compare/${id}`}
                icon={GitCompare}
              >
                {STREAM_META[id].label}
              </DrawerLink>
            ))}
          </NavSection>

          <NavSection title="Ecosystem">
            {ECOSYSTEM_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium text-foreground/85 transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0 opacity-75" />
                <span className="flex-1">{label}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40" />
              </a>
            ))}
          </NavSection>
        </div>
      </div>
    </>,
    document.body,
  );
}
