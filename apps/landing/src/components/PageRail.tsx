import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, BookMarked } from 'lucide-react';
import { PRIMARY_NAV, PRIMARY_NAV_IDS, RAIL_INTRO, navHref } from '../constants/nav';
import { usePageRailActive } from '../hooks/useNavScrollSpy';

interface Item { id: string; label: string }

const RAIL_ITEMS: Item[] = [
  { id: RAIL_INTRO.id, label: RAIL_INTRO.label },
  ...PRIMARY_NAV.map((n) => ({ id: n.id, label: n.railLabel ?? n.label })),
];

const STORAGE_KEY = 'i18nprune-rail-open';

export default function PageRail() {
  const active = usePageRailActive(PRIMARY_NAV_IDS, RAIL_INTRO.id);
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      // Default collapsed; persisted '1' / '0' restores last choice across visits.
      if (v === null) return false;
      return v === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, open ? '1' : '0'); } catch { /* ignore */ }
  }, [open]);

  useEffect(() => {
    const isEditableTarget = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      return Boolean(el.closest('input, textarea, select, [contenteditable="true"]'));
    };

    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'b' || e.altKey || e.shiftKey) return;
      if (isEditableTarget(e.target)) return;
      if (!window.matchMedia('(min-width: 1280px)').matches) return;
      e.preventDefault();
      setOpen((o) => !o);
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <aside
      aria-label="On this page"
      className={`hidden xl:flex fixed top-1/2 -translate-y-1/2 z-40 items-center pointer-events-none transition-[right] duration-300 ease-out ${open ? 'right-4' : 'right-0'}`}
      data-testid="page-rail"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {!open && (
          <motion.button
            key="collapsed"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open page navigation"
            title="Ctrl+B or ⌘B"
            data-testid="rail-toggle-open"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-1.5 rounded-l-xl rounded-r-none border border-r-0 border-border/40 bg-card/40 backdrop-blur-xl py-2.5 px-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <BookMarked className="w-3 h-3" />
            <span
              className="font-mono text-[9.5px] uppercase tracking-[0.22em]"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              On this page
            </span>
          </motion.button>
        )}

        {open && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xl px-2 py-3 max-h-[70vh] overflow-y-auto shadow-lg shadow-black/20"
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                On this page
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Collapse page navigation"
                title="Ctrl+B or ⌘B"
                data-testid="rail-toggle-close"
                className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <nav className="flex flex-col gap-0.5">
              {RAIL_ITEMS.map((it) => {
                const isActive = active === it.id;
                return (
                  <a
                    key={it.id}
                    href={navHref(it.id)}
                    className="relative group flex items-center gap-2 pl-2 pr-3 py-1 rounded-md transition-colors"
                    data-testid={`rail-${it.id}`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-primary scale-150 shadow-[0_0_8px_hsl(var(--primary))]'
                          : 'bg-border group-hover:bg-muted-foreground'
                      }`}
                    />
                    <span
                      className={`font-mono text-[10.5px] transition-colors ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground/70 group-hover:text-foreground'
                      }`}
                    >
                      {it.label}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="rail-pill"
                        className="absolute inset-y-0 left-0 w-0.5 rounded-r bg-primary"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        aria-hidden="true"
                      />
                    )}
                  </a>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
