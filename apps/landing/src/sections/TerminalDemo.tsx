import { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Terminal as TerminalIcon, Zap } from 'lucide-react';
import ShikiCode from '../components/ShikiCode';

type Line =
  | { type: 'cmd'; text: string }
  | { type: 'out'; text: string; tone?: 'ok' | 'warn' | 'err' | 'muted' | 'json' };

interface Session {
  id: string;
  label: string;
  cwd: string;
  description: string;
  lines: Line[];
}

const SESSIONS: Session[] = [
  {
    id: 'validate',
    label: 'validate',
    cwd: '~/app',
    description: 'Static-analyze the codebase, compare with locale files, surface missing & dynamic keys.',
    lines: [
      { type: 'cmd', text: 'i18nprune validate --json' },
      { type: 'out', text: '→ scanning 142 files (.tsx, .ts, .vue)…', tone: 'muted' },
      { type: 'out', text: '→ resolved import bindings · 18 t() aliases', tone: 'muted' },
      { type: 'out', text: '✓ 1,284 literal keys extracted', tone: 'ok' },
      { type: 'out', text: '⚠ 14 dynamic call sites (runtime-computed)', tone: 'warn' },
      { type: 'out', text: '✗ 7 missing in fr.json · 3 missing in ja.json', tone: 'err' },
      { type: 'out', text: '{ "literal": 1284, "dynamic": 14, "missing": 10 }', tone: 'json' },
    ],
  },
  {
    id: 'sync',
    label: 'sync',
    cwd: '~/app',
    description: 'Align every locale file to the source-of-truth shape. Preserve, merge, prune.',
    lines: [
      { type: 'cmd', text: 'i18nprune sync --yes' },
      { type: 'out', text: '→ source: locales/en.json (1,284 keys)', tone: 'muted' },
      { type: 'out', text: '→ targets: fr · es · ja · de · pt', tone: 'muted' },
      { type: 'out', text: '+ merged 7 keys into fr.json', tone: 'ok' },
      { type: 'out', text: '+ merged 3 keys into ja.json', tone: 'ok' },
      { type: 'out', text: '- pruned 12 dead keys (was: 1,296 → 1,284)', tone: 'ok' },
      { type: 'out', text: '✓ all targets structurally aligned · 412ms', tone: 'ok' },
    ],
  },
  {
    id: 'generate',
    label: 'generate',
    cwd: '~/app',
    description: 'Auto-translate missing keys via configurable providers. Resume safely.',
    lines: [
      { type: 'cmd', text: 'i18nprune generate --resume --target fr,ja' },
      { type: 'out', text: '→ provider: gtx · concurrency: 6', tone: 'muted' },
      { type: 'out', text: '→ topping up fr.json (7 keys)…', tone: 'muted' },
      { type: 'out', text: '✓ fr · 7/7 translated · 1.2s', tone: 'ok' },
      { type: 'out', text: '→ topping up ja.json (3 keys)…', tone: 'muted' },
      { type: 'out', text: '✓ ja · 3/3 translated · 0.6s', tone: 'ok' },
      { type: 'out', text: '✓ 10 keys generated · 0 errors', tone: 'ok' },
    ],
  },
  {
    id: 'report',
    label: 'report',
    cwd: '~/app',
    description: 'Export a project health report for review or AI agents.',
    lines: [
      { type: 'cmd', text: 'i18nprune report --format json' },
      { type: 'out', text: '{', tone: 'json' },
      { type: 'out', text: '  "locales": ["en","fr","es","ja","de","pt"],', tone: 'json' },
      { type: 'out', text: '  "source": "en", "keys": 1284,', tone: 'json' },
      { type: 'out', text: '  "parity": { "fr": 1.0, "ja": 1.0, "de": 0.98 },', tone: 'json' },
      { type: 'out', text: '  "dead_keys": 0, "dynamic_keys": 14', tone: 'json' },
      { type: 'out', text: '}', tone: 'json' },
    ],
  },
];

const toneClass: Record<string, string> = {
  ok: 'text-primary',
  warn: 'text-amber-400',
  err: 'text-red-400',
  muted: 'text-muted-foreground',
  json: 'text-sky-300',
};

export default function TerminalDemo() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const session = SESSIONS[active];

  // Reset & animate output line-by-line when tab changes
  useEffect(() => {
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= session.lines.length) {
          clearInterval(id);
          return s;
        }
        return s + 1;
      });
    }, 380);
    return () => clearInterval(id);
  }, [active, session.lines.length]);

  // Subtle perspective tilt on scroll
  const { scrollYProgress } = useScroll();
  const tiltX = useTransform(scrollYProgress, [0, 1], [2, -1]);

  const visibleLines = useMemo(() => session.lines.slice(0, step), [session, step]);

  return (
    <section
      id="terminal"
      className="relative py-28 border-t border-border/30"
      data-testid="terminal-section"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-start">
          {/* Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ rotateX: tiltX as unknown as number, transformPerspective: 1400 }}
            className="relative"
          >
            <div className="absolute -inset-6 accent-glow opacity-60 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-2xl overflow-hidden border border-border/70 shadow-2xl shadow-black/40 glass-panel">
              {/* Chrome */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  <span className="text-primary">●</span> i18nprune · {session.cwd}
                </div>
                <div className="w-12" />
              </div>
              {/* Tabs */}
              <div className="flex items-center gap-1 px-3 pt-2 border-b border-border/40 bg-card/50">
                {SESSIONS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(i)}
                    data-testid={`terminal-tab-${s.id}`}
                    className={`relative px-3 py-1.5 text-xs font-mono rounded-t-md transition-colors ${
                      active === i ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.label}
                    {active === i && (
                      <motion.span
                        layoutId="term-tab"
                        className="absolute inset-x-1 -bottom-px h-0.5 bg-primary rounded-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="terminal-bg p-5 font-mono text-[13px] min-h-[340px] relative overflow-hidden">
                {/* Scanline */}
                <motion.div
                  key={active}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 380, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1.6, ease: 'easeInOut' }}
                  className="scanline absolute inset-x-0 h-12 pointer-events-none"
                />
                {visibleLines.map((line, i) => (
                  <motion.div
                    key={`${active}-${i}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="leading-relaxed"
                  >
                    {line.type === 'cmd' ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-primary shrink-0">❯</span>
                        <ShikiCode code={line.text} lang="bash" className="min-w-0 flex-1" />
                      </div>
                    ) : (
                      <div className={toneClass[line.tone ?? 'muted']}>{line.text}</div>
                    )}
                  </motion.div>
                ))}
                {step < session.lines.length && (
                  <span className="inline-block w-2 h-4 bg-primary/80 align-middle animate-pulse" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Context panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3 flex items-center gap-2">
              <TerminalIcon className="w-3.5 h-3.5" /> Live demo
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
              See it run before you{' '}
              <span className="stat-highlight">trust it</span>.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {session.description}
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { k: 'Mode', v: '--yes · non-interactive' },
                { k: 'Output', v: '--json · structured for CI' },
                { k: 'Runtime', v: 'Node · Browser · Workers' },
              ].map((it) => (
                <li key={it.k} className="flex items-center justify-between text-sm py-2 border-b border-border/40">
                  <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">{it.k}</span>
                  <span className="font-mono text-foreground">{it.v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 text-xs text-primary font-mono">
              <Zap className="w-3.5 h-3.5" /> Avg run: 412ms across 1,284 keys
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
