import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, CircleDashed, Circle, GitBranch, Zap, Bot } from 'lucide-react';

interface Step { name: string; duration: string; highlight?: boolean; }
const STEPS: Step[] = [
  { name: 'Checkout code', duration: '1s' },
  { name: 'Install dependencies', duration: '12s' },
  { name: 'i18nprune validate', duration: '0.8s', highlight: true },
  { name: 'Build project', duration: '24s' },
];

const INTEGRATIONS: { name: string; subtitle: string; svg: React.ReactNode }[] = [
  {
    name: 'GitHub Actions',
    subtitle: 'CI gate',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
    ),
  },
  {
    name: 'Vercel',
    subtitle: 'Edge deploys',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2L24 22H0L12 2z"/></svg>
    ),
  },
  {
    name: 'Netlify',
    subtitle: 'Build hooks',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M9.6 9.6h4.8v4.8H9.6V9.6zm9.6 4.32V9.84l-4.8-4.8H9.6L4.8 9.84v4.32l4.8 4.8h4.8l4.8-4.8z"/></svg>
    ),
  },
  {
    name: 'AI agents',
    subtitle: '--json structured',
    svg: <Bot className="w-5 h-5" />,
  },
];

export default function CIIntegration() {
  // step index: -1 = not started, 0..3 = running, 4 = all complete
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((s) => (s >= STEPS.length ? 0 : s + 1));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const allDone = active >= STEPS.length;

  return (
    <section
      id="ci"
      className="relative py-28 border-t border-border/30"
      data-testid="ci-section"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Automation first
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              Built for{' '}
              <span className="stat-highlight">pipelines &amp; agents.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-balance">
              Drop <code className="font-mono text-foreground bg-card/60 border border-border/50 rounded px-1.5 py-0.5 text-sm">i18nprune validate</code> into any pipeline. Structured <code className="font-mono text-foreground bg-card/60 border border-border/50 rounded px-1.5 py-0.5 text-sm">--json</code> output blocks broken PRs before merge and flows cleanly into Slack alerts, custom dashboards, and AI agents.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3" data-testid="ci-integrations">
              {INTEGRATIONS.map((it) => (
                <div
                  key={it.name}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 backdrop-blur-md px-3 py-2.5 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    {it.svg}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight truncate">{it.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground truncate">{it.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CI Run Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -inset-6 accent-glow opacity-50 blur-2xl pointer-events-none" aria-hidden="true" />
            <div className="relative rounded-2xl glass-panel overflow-hidden shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/60">
                <div className="flex items-center gap-2.5">
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-semibold">CI / PR Check</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">#2147</span>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono ${
                    allDone
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                  data-testid="ci-status"
                >
                  <span
                    className={`relative flex w-1.5 h-1.5 rounded-full ${
                      allDone ? 'bg-primary' : 'bg-amber-300 animate-pulse-dot'
                    }`}
                  />
                  {allDone ? 'Passed' : 'Running'}
                </div>
              </div>

              <div className="p-4 space-y-2">
                {STEPS.map((step, i) => {
                  const state = i < active ? 'done' : i === active ? 'running' : 'pending';
                  return (
                    <div
                      key={step.name}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                        step.highlight
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border/40 bg-card/30'
                      }`}
                      data-testid={`ci-step-${i}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {state === 'done' && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                        {state === 'running' && (
                          <CircleDashed className="w-4 h-4 text-amber-300 shrink-0 animate-spin" />
                        )}
                        {state === 'pending' && (
                          <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        )}
                        <span
                          className={`text-sm truncate ${
                            step.highlight ? 'font-mono text-foreground' : 'text-foreground/90'
                          } ${state === 'pending' ? 'opacity-50' : ''}`}
                        >
                          {step.highlight && <span className="text-primary">▸ </span>}
                          {step.name}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                        {state === 'done' ? `✓ ${step.duration}` : state === 'running' ? '…' : step.duration}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-3 border-t border-border/50 bg-card/40 font-mono text-[11px] text-muted-foreground flex items-center justify-between">
                <span>
                  <span className="text-primary">●</span> i18nprune validate · 0 drift · 1,284 keys
                </span>
                <span>{allDone ? 'all checks · passed' : 'in progress'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
