import { Button } from '@/components/ui/button';
import HeaderNavDrawer from '@/app/layout/header/nav';
import { useTheme } from '@i18nprune/ui/react/theme';
import CompareNavMenu from '@/features/compare/CompareNavMenu';
import {
  BookOpen,
  Github,
  Globe,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Product', href: 'https://i18nprune.dev', icon: Globe },
  { label: 'Docs', href: 'https://docs.i18nprune.dev', icon: BookOpen },
  { label: 'GitHub', href: 'https://github.com/zamdevio/i18nprune', icon: Github },
] as const;

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default function SiteHeader() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const mainNav = [
    { label: 'Overview', path: '/' },
    { label: 'CLI', path: '/cli' },
    { label: 'Core', path: '/core' },
    { label: 'Extension', path: '/extension' },
    { label: 'Search', path: '/search' },
  ] as const;

  const navLinkClass = (path: string) => {
    const active =
      path === '/'
        ? location.pathname === '/'
        : path === '/search'
          ? location.pathname === '/search'
          : isActive(path);
    return `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      active
        ? 'bg-accent text-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
    }`;
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border/60 backdrop-blur-xl ${
        menuOpen ? 'bg-background' : 'bg-background/95'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        <Link to="/" className="mr-6 flex shrink-0 items-center gap-2.5 sm:mr-8">
          <img src="/i18nprune.svg" alt="" className="h-7 w-7 rounded-lg" />
          <span className="min-w-0 truncate font-heading text-xs font-semibold sm:text-sm">
            i18nprune <span className="font-normal text-muted-foreground">releases</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 nav-wide:flex">
          {mainNav.map(({ label, path }) => (
            <Link key={path} to={path} className={navLinkClass(path)}>
              {label}
            </Link>
          ))}
          <CompareNavMenu />
        </nav>

        <div className="flex-1" />

        <div className="mr-2 hidden items-center gap-1 nav-wide:flex">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{label}</span>
            </a>
          ))}
        </div>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="ml-1 h-8 w-8 nav-wide:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <HeaderNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
