import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Command,
  CornerDownLeft,
  Search,
  Terminal as TerminalIcon,
  Globe2,
  Cloud,
  Github,
  Package,
  Box,
  BarChart3,
  GitBranch,
  type LucideIcon,
} from 'lucide-react';
import { linkHref } from '../lib/meta';
import { useMeta } from '../context/MetaContext';
import { PRIMARY_NAV, navHref } from '../constants/nav';

type PaletteGroup = 'navigation' | 'external';

interface PaletteItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  group: PaletteGroup;
  Icon: LucideIcon;
}

const NAV_ITEMS: PaletteItem[] = [
  {
    id: 'go-top',
    title: '> top',
    desc: 'Jump to intro / hero',
    href: '#top',
    group: 'navigation',
    Icon: TerminalIcon,
  },
  ...PRIMARY_NAV.map((n) => ({
    id: `go-${n.id}`,
    title: `> ${n.id}`,
    desc: `Jump to ${n.label}`,
    href: navHref(n.id),
    group: 'navigation' as const,
    Icon: TerminalIcon,
  })),
];

export default function CommandPalette() {
  const { links } = useMeta();

  const EXTERNAL_ITEMS: PaletteItem[] = useMemo(
    () => [
      { id: 'ext-web', title: 'web.i18nprune.dev', desc: 'Browser playground & explorer', href: linkHref(links, 'webApp'), group: 'external', Icon: Globe2 },
      { id: 'ext-report', title: 'report.i18nprune.dev', desc: 'Report UI · hosted share links', href: linkHref(links, 'report'), group: 'external', Icon: BarChart3 },
      { id: 'ext-git', title: 'git.i18nprune.dev', desc: 'Commit history · timeline · authors', href: linkHref(links, 'gitAnalytics'), group: 'external', Icon: GitBranch },
      { id: 'ext-worker', title: 'worker.i18nprune.dev', desc: 'Edge validators · Swagger docs', href: linkHref(links, 'workerDocs'), group: 'external', Icon: Cloud },
      { id: 'ext-github', title: 'GitHub repository', desc: 'Source & issues', href: linkHref(links, 'githubRepo'), group: 'external', Icon: Github },
      { id: 'ext-npm', title: 'npm · i18nprune', desc: 'CLI package on npm', href: linkHref(links, 'npmCli'), group: 'external', Icon: Package },
      { id: 'ext-sandbox', title: 'CodeSandbox', desc: 'Try the SDK in the browser', href: linkHref(links, 'sandbox'), group: 'external', Icon: Box },
    ],
    [links],
  );

  const ALL_ITEMS = useMemo(() => [...NAV_ITEMS, ...EXTERNAL_ITEMS], [EXTERNAL_ITEMS]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_ITEMS;
    return ALL_ITEMS.filter(
      (c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q),
    );
  }, [query, ALL_ITEMS]);

  const handleSelect = useCallback((item: PaletteItem) => {
    if (item.href.startsWith('#')) {
      document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault();
        handleSelect(filtered[selected]);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, filtered, selected, handleSelect]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette (Cmd+K)"
        data-testid="cmdk-trigger"
        className="fixed bottom-5 right-4 sm:right-5 z-40 items-center justify-center rounded-full border border-border/60 bg-card/70 backdrop-blur-xl text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all max-md:w-11 max-md:h-11 md:inline-flex md:gap-1.5 md:px-3 md:h-9 md:text-[11px] md:font-mono"
      >
        <Command className="w-4 h-4 md:w-3 md:h-3" />
        <span className="hidden md:inline">K</span>
        <span className="hidden md:inline text-border">·</span>
        <span className="hidden md:inline">palette</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-start justify-center pt-20 sm:pt-24 px-3 sm:px-4 pb-[env(safe-area-inset-bottom)] bg-background/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
            data-testid="cmdk-overlay"
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl glass-panel shadow-2xl shadow-black/50 overflow-hidden"
              data-testid="cmdk-panel"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
                <Search className="w-4 h-4 text-primary shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search navigation or links…"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  data-testid="cmdk-input"
                />
                <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-muted-foreground font-mono">
                    No matches for <span className="text-foreground">{query}</span>
                  </div>
                ) : (
                  filtered.map((it, i) => {
                    const prev = filtered[i - 1];
                    const showGroup = i === 0 || prev.group !== it.group;
                    const isSelected = i === selected;
                    const Icon = it.Icon;
                    return (
                      <div key={it.id}>
                        {showGroup && (
                          <div className="px-3 pb-1 pt-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-primary/90">
                            {it.group === 'navigation' ? 'Navigation' : 'External links'}
                          </div>
                        )}
                        <button
                          type="button"
                          onMouseEnter={() => setSelected(i)}
                          onClick={() => handleSelect(it)}
                          data-testid={`cmdk-item-${it.id}`}
                          className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all min-h-[3.5rem] border ${
                            isSelected
                              ? 'bg-primary/12 border-primary/35 shadow-[0_0_22px_-6px_hsl(var(--primary)/0.45)]'
                              : 'border-transparent hover:bg-card/50 hover:border-border/50'
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                          />
                          <div className="flex-1 min-w-0 pr-1">
                            <code
                              className={`block text-sm font-mono leading-snug truncate ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}
                            >
                              {it.title}
                            </code>
                            <span className="block text-[11px] text-muted-foreground leading-snug mt-1 line-clamp-2">
                              {it.desc}
                            </span>
                          </div>
                          {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-border/40 bg-card/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>↑↓ navigate · ⏎ open · ESC close</span>
                <span className="hidden sm:inline">
                  {filtered.length} link{filtered.length === 1 ? '' : 's'}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
