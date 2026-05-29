import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Github, Menu, Moon, Sun, X, BookOpen } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useGitHub } from '../hooks/useGitHub';
import { formatCount } from '../lib/github';
import { linkHref } from '../lib/meta';
import { useMeta } from '../context/MetaContext';
import { PRIMARY_NAV, PRIMARY_NAV_IDS, navHref } from '../constants/nav';
import { useHeaderPrimaryActive } from '../hooks/useNavScrollSpy';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { links, cliVersion } = useMeta();
  const gh = useGitHub();
  const [scrolled, setScrolled] = useState(false);
  const active = useHeaderPrimaryActive(PRIMARY_NAV_IDS);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  // scroll-aware chrome
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close mobile menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [mobileOpen]);

  // close mobile menu on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // lock page scroll while mobile nav is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const stars = gh && gh.stars != null ? formatCount(gh.stars) : null;

  return (
    <motion.header
      ref={headerRef}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'h-16 bg-background/70 backdrop-blur-xl border-b border-border/40'
          : 'h-20 bg-transparent border-b border-transparent'
      }`}
      data-testid="site-header"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <a
          href="#top"
          className="flex items-center gap-2.5 shrink-0 group"
          data-testid="logo-link"
        >
          <img src="/icons/i18nprune.svg" alt="i18nprune" className="w-8 h-8 rounded-lg" />
          <span className="font-display font-bold text-[15px] tracking-tight">
            i18nprune
          </span>
          <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded-md border border-border/60 text-muted-foreground">
            v{cliVersion}
          </span>
        </a>

        {/* Desktop pill nav */}
        <nav
          className="hidden lg:flex items-center gap-0.5 rounded-full border border-border/40 bg-card/30 backdrop-blur-md px-1 py-1 max-w-[min(100%,52rem)] overflow-x-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Primary"
        >
          {PRIMARY_NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={navHref(item.id)}
                className="relative shrink-0 px-2.5 sm:px-3 py-1.5 text-[12.5px] sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full whitespace-nowrap"
                data-testid={`nav-${item.id}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-full bg-primary/15 border border-primary/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    aria-hidden="true"
                  />
                )}
                <span className={`relative ${isActive ? 'text-foreground' : ''}`}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            data-testid="theme-toggle"
            className="w-9 h-9 rounded-full border border-border/40 bg-card/30 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <span className="relative w-4 h-4">
              <Sun
                className={`absolute inset-0 w-4 h-4 transition-all duration-500 ${
                  theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <Moon
                className={`absolute inset-0 w-4 h-4 transition-all duration-500 ${
                  theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
                }`}
              />
            </span>
          </button>

          <a
            href={linkHref(links, 'githubRepo')}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="github-link"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border/40 bg-card/30 backdrop-blur-md text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <Github className="w-4 h-4" />
            <span className="hidden md:inline">GitHub</span>
            {gh === null ? (
              <span
                className="inline-block w-7 h-3.5 rounded bg-muted/40 animate-pulse"
                aria-hidden="true"
                data-testid="github-stars-skeleton"
              />
            ) : stars ? (
              <span className="font-mono text-xs text-primary" data-testid="github-stars">
                {stars}
              </span>
            ) : null}
          </a>

          <a
            href={linkHref(links, 'docs')}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="header-cta"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-[0_0_24px_-4px_hsl(var(--primary))] hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            data-testid="mobile-menu-toggle"
            className="lg:hidden w-9 h-9 rounded-full border border-border/40 bg-card/30 backdrop-blur-md flex items-center justify-center text-foreground"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden border-t border-border/40 bg-background/95 backdrop-blur-xl"
            data-testid="mobile-menu"
          >
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col gap-1 max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto">
              <a
                href={linkHref(links, 'docs')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="mb-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-[0_0_24px_-4px_hsl(var(--primary))]"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              {PRIMARY_NAV.map((item) => (
                <a
                  key={item.id}
                  href={navHref(item.id)}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active === item.id
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                  }`}
                  data-testid={`mobile-nav-${item.id}`}
                >
                  {item.label}
                </a>
              ))}
              <div className="h-px bg-border/40 my-2" />
              <a
                href={linkHref(links, 'docs')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Documentation
              </a>
              <a
                href={linkHref(links, 'githubRepo')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
              >
                <Github className="w-4 h-4" /> GitHub {stars && <span className="ml-auto font-mono text-xs text-primary">{stars}</span>}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
