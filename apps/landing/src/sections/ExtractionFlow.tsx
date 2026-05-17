import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

type Phase = 'before' | 'after';

interface KeyEntry { key: string; status: 'ok' | 'missing' | 'dynamic' | 'unused'; }

const SOURCE_KEYS: KeyEntry[] = [
  { key: 'welcome_title', status: 'ok' },
  { key: 'stats.active_users', status: 'ok' },
  { key: 'nav.dashboard', status: 'ok' },
  { key: 'errors.not_found', status: 'ok' },
];

const LOCALE_BEFORE: KeyEntry[] = [
  { key: 'welcome_title', status: 'ok' },
  { key: 'stats.active_users', status: 'missing' },
  { key: 'nav.dashboard', status: 'ok' },
  { key: 'errors.not_found', status: 'missing' },
  { key: 'legacy.old_banner', status: 'unused' },
];

const LOCALE_AFTER: KeyEntry[] = [
  { key: 'welcome_title', status: 'ok' },
  { key: 'stats.active_users', status: 'ok' },
  { key: 'nav.dashboard', status: 'ok' },
  { key: 'errors.not_found', status: 'ok' },
];

const REPORT_BEFORE = [
  { line: '$ i18nprune validate --json', tone: 'cmd' },
  { line: '✗ 2 missing in fr.json', tone: 'err' },
  { line: '⚠ 1 unused key (legacy.old_banner)', tone: 'warn' },
  { line: '↳ exit 1 · CI blocked', tone: 'muted' },
];

const REPORT_AFTER = [
  { line: '$ i18nprune validate --json', tone: 'cmd' },
  { line: '✓ 4 keys · 0 drift · 0 missing', tone: 'ok' },
  { line: '✓ all locales aligned', tone: 'ok' },
  { line: '↳ exit 0 · CI passed', tone: 'muted' },
];

const STATUS_STYLE: Record<KeyEntry['status'], { dot: string; chip: string; icon: React.ReactNode }> = {
  ok: { dot: 'bg-primary', chip: 'text-primary', icon: <Check className="w-3 h-3" /> },
  missing: { dot: 'bg-red-400 animate-pulse', chip: 'text-red-400', icon: <X className="w-3 h-3" /> },
  unused: { dot: 'bg-amber-400 animate-pulse', chip: 'text-amber-400', icon: <AlertTriangle className="w-3 h-3" /> },
  dynamic: { dot: 'bg-amber-400', chip: 'text-amber-400', icon: <AlertTriangle className="w-3 h-3" /> },
};

const TONE: Record<string, string> = {
  cmd: 'text-foreground',
  ok: 'text-primary',
  warn: 'text-amber-400',
  err: 'text-red-400',
  muted: 'text-muted-foreground',
};

export default function ExtractionFlow() {
  const [phase, setPhase] = useState<Phase>('before');

  // Auto-cycle every 4s
  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p === 'before' ? 'after' : 'before'));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const locale = phase === 'before' ? LOCALE_BEFORE : LOCALE_AFTER;
  const report = phase === 'before' ? REPORT_BEFORE : REPORT_AFTER;

  return (
    <section
      id="extraction-flow"
      className="relative py-28 border-t border-border/30"
      data-testid="extraction-section"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div className="max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">
              Before / after
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              Drift in.{' '}
              <span className="stat-highlight">Parity out.</span>
            </h2>
          </div>
          <div
            className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/40 backdrop-blur-md p-1"
            role="tablist"
            data-testid="phase-toggle"
          >
            {(['before', 'after'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`relative px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-full transition-colors ${
                  phase === p ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`phase-${p}`}
              >
                {phase === p && (
                  <motion.span
                    layoutId="phase-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative">{p === 'before' ? 'Before' : 'After'}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1fr_1fr] gap-4 items-stretch">
          {/* Panel 1: Source */}
          <Panel title="Source code" subtitle="Dashboard.tsx" testId="extraction-source">
            <div className="font-mono text-[12px] space-y-1.5">
              {SOURCE_KEYS.map((k) => (
                <div key={k.key} className="flex items-center justify-between py-1">
                  <code className="text-foreground/90">
                    <span className="text-muted-foreground/60">t(</span>
                    <span className="text-amber-300">'{k.key}'</span>
                    <span className="text-muted-foreground/60">)</span>
                  </code>
                  <span className={`inline-flex w-1.5 h-1.5 rounded-full bg-primary`} />
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-border/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {SOURCE_KEYS.length} literal keys
              </div>
            </div>
          </Panel>

          {/* Arrow */}
          <div className="lg:hidden h-4" />

          {/* Panel 2: Locale */}
          <Panel title="Target locale" subtitle="locales/fr.json" testId="extraction-locale" badge={phase}>
            <div className="font-mono text-[12px] space-y-1.5">
              <AnimatePresence mode="popLayout">
                {locale.map((k) => {
                  const s = STATUS_STYLE[k.status];
                  return (
                    <motion.div
                      key={`${phase}-${k.key}`}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center justify-between py-1"
                    >
                      <code className="text-foreground/90">
                        <span className="text-amber-300">'{k.key}'</span>
                      </code>
                      <span className={`inline-flex items-center gap-1 ${s.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        <span className="text-[10px] uppercase tracking-wider">
                          {k.status}
                        </span>
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div className="pt-2 mt-2 border-t border-border/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {phase === 'before' ? '5 keys · 2 missing · 1 unused' : `${LOCALE_AFTER.length} keys · 0 issues`}
              </div>
            </div>
          </Panel>

          {/* Panel 3: Report */}
          <Panel title="Validation report" subtitle="--json output" testId="extraction-report">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="font-mono text-[12px] space-y-1.5"
              >
                {report.map((r, i) => (
                  <div key={i} className={TONE[r.tone]}>{r.line}</div>
                ))}
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider ${
                phase === 'before' ? 'text-red-400' : 'text-primary'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${phase === 'before' ? 'bg-red-400' : 'bg-primary'}`} />
                {phase === 'before' ? 'CI blocked' : 'CI passed'}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {phase === 'before' ? 'exit 1' : 'exit 0'}
              </span>
            </div>
          </Panel>
        </div>

        {/* Connecting flow indicator */}
        <div className="hidden lg:flex items-center justify-center mt-6 gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <span>Scan</span>
          <ArrowRight className="w-3 h-3" />
          <span>Compare</span>
          <ArrowRight className="w-3 h-3" />
          <span>Report</span>
        </div>
      </div>
    </section>
  );
}

function Panel({
  title, subtitle, children, testId, badge,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  testId?: string;
  badge?: Phase;
}) {
  return (
    <div className="rounded-2xl glass-panel overflow-hidden" data-testid={testId}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/70">
        <div className="min-w-0">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {title}
          </div>
          <div className="text-sm font-semibold truncate">{subtitle}</div>
        </div>
        {badge && (
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
            badge === 'before' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-primary/10 text-primary border border-primary/30'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 terminal-bg min-h-[260px]">{children}</div>
    </div>
  );
}
