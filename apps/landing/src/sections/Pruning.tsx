import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Sparkles } from 'lucide-react';

interface KeyNode {
  path: string;
  alive: boolean;
  size: number; // bytes
}

const KEYS: KeyNode[] = [
  { path: 'dashboard.welcome_title', alive: true, size: 312 },
  { path: 'dashboard.stats.active_users', alive: true, size: 456 },
  { path: 'dashboard.stats.signups', alive: true, size: 398 },
  { path: 'nav.home', alive: true, size: 124 },
  { path: 'nav.dashboard', alive: true, size: 184 },
  { path: 'nav.legacy_admin', alive: false, size: 248 },
  { path: 'auth.login_title', alive: true, size: 220 },
  { path: 'auth.forgot_password', alive: true, size: 342 },
  { path: 'errors.deprecated_v1', alive: false, size: 612 },
  { path: 'errors.not_found', alive: true, size: 288 },
  { path: 'banners.old_promo_2023', alive: false, size: 918 },
  { path: 'banners.holiday_2022', alive: false, size: 824 },
  { path: 'footer.copyright', alive: true, size: 156 },
  { path: 'unused.legacy_modal_v1', alive: false, size: 1248 },
];

export default function Pruning() {
  const [pruned, setPruned] = useState(false);

  // Auto-loop the demo
  useEffect(() => {
    const id = setInterval(() => setPruned((p) => !p), 4500);
    return () => clearInterval(id);
  }, []);

  const total = KEYS.length;
  const alive = KEYS.filter((k) => k.alive).length;
  const dead = total - alive;
  const totalBytes = KEYS.reduce((s, k) => s + k.size, 0);
  const aliveBytes = KEYS.filter((k) => k.alive).reduce((s, k) => s + k.size, 0);
  const savedBytes = totalBytes - aliveBytes;

  const visible = pruned ? KEYS.filter((k) => k.alive) : KEYS;

  return (
    <section
      id="pruning"
      className="relative py-28 border-t border-border/30"
      data-testid="pruning-section"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 items-start">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-28"
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3 flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5" /> Dead-key pruning
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              Tree-shake your{' '}
              <span className="stat-highlight">translations.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-balance">
              i18nprune walks your AST to find every <code className="font-mono text-foreground bg-card/60 border border-border/50 rounded px-1.5 py-0.5 text-sm">t()</code> call site, then quietly removes any locale key that no source file references. Optional ripgrep verification before deletion, so nothing important slips out.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3" data-testid="pruning-stats">
              <Stat label="Keys" before={total} after={alive} unit="" pruned={pruned} />
              <Stat label="Removed" before={0} after={dead} unit="" pruned={pruned} accent="red" />
              <Stat label="Saved" before={0} after={savedBytes} unit="B" pruned={pruned} accent="primary" />
            </div>

            <button
              type="button"
              onClick={() => setPruned((p) => !p)}
              data-testid="pruning-trigger"
              className={`mt-8 btn-glow inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                pruned
                  ? 'bg-card/60 border border-border/60 text-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {pruned ? (
                <>
                  <Sparkles className="w-4 h-4" /> Restore demo
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" /> Run cleanup
                </>
              )}
            </button>
          </motion.div>

          {/* Tree visualization */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl glass-panel overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/70">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[11px] font-mono text-muted-foreground">locales/en.json</span>
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                pruned
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {pruned ? 'pruned' : 'pre-prune'}
              </span>
            </div>

            <div className="terminal-bg p-5 font-mono text-[12px] min-h-[420px] relative">
              <div className="text-muted-foreground mb-2">{'{'}</div>
              <AnimatePresence mode="popLayout">
                {visible.map((k) => {
                  const isDead = !k.alive;
                  return (
                    <motion.div
                      key={k.path}
                      layout
                      initial={{ opacity: 0, x: -6 }}
                      animate={{
                        opacity: pruned && isDead ? 0 : isDead ? 0.45 : 1,
                        x: 0,
                        filter: pruned && isDead ? 'blur(4px)' : 'blur(0)',
                      }}
                      exit={{
                        opacity: 0,
                        x: -20,
                        filter: 'blur(6px)',
                        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="group flex items-center justify-between pl-4 py-1 border-l border-border/40 ml-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground/60 shrink-0">├─</span>
                        <code className={`truncate ${isDead ? 'text-red-300 line-through decoration-red-400/60' : 'text-foreground/90'}`}>
                          <span className="text-amber-300">"</span>
                          {k.path}
                          <span className="text-amber-300">"</span>
                          <span className="text-muted-foreground/60">: </span>
                          <span className="text-sky-300">"…"</span>
                        </code>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-muted-foreground">{k.size}B</span>
                        {isDead ? (
                          <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">dead</span>
                        ) : (
                          <span className="text-[10px] font-mono text-primary uppercase tracking-wider">alive</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div className="text-muted-foreground mt-2">{'}'}</div>

              {/* Pruning sweep effect */}
              <AnimatePresence>
                {pruned && (
                  <motion.div
                    initial={{ top: 0, opacity: 0 }}
                    animate={{ top: '100%', opacity: [0, 0.7, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                    className="scanline absolute inset-x-0 h-10 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="px-4 py-2.5 border-t border-border/50 bg-card/70 flex items-center justify-between text-[11px] font-mono">
              <span className={pruned ? 'text-primary' : 'text-muted-foreground'}>
                {pruned ? `✓ ${dead} keys removed · ${savedBytes}B saved` : `⚠ ${dead} dead keys detected`}
              </span>
              <span className="text-muted-foreground">{visible.length}/{total} retained</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label, before, after, unit, pruned, accent,
}: {
  label: string;
  before: number;
  after: number;
  unit: string;
  pruned: boolean;
  accent?: 'red' | 'primary';
}) {
  const value = pruned ? after : before;
  const color = accent === 'red' ? 'text-red-400' : accent === 'primary' ? 'text-primary' : 'text-foreground';
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-md p-3">
      <div className={`font-display text-2xl font-bold tabular-nums ${color}`}>
        {pruned ? (
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {value.toLocaleString()}
          </motion.span>
        ) : (
          <span>{value.toLocaleString()}</span>
        )}
        {unit && <span className="text-sm text-muted-foreground ml-0.5">{unit}</span>}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}
