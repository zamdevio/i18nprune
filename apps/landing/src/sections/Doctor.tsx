import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, CircleDashed, Stethoscope, Activity } from 'lucide-react';
import ShikiCode from '../components/ShikiCode';

interface Step {
  label: string;
  detail: string;
  delay: number;
}

const STEPS: Step[] = [
  { label: 'node',     detail: '20.10.0 · esm',        delay: 600 },
  { label: 'ripgrep',  detail: '14.0 · binary found',  delay: 1100 },
  { label: 'config',   detail: 'i18nprune.config.ts',   delay: 1600 },
  { label: 'source',   detail: 'locales/en.json',      delay: 2100 },
  { label: 'targets',  detail: 'fr · ja · de · pt',     delay: 2600 },
  { label: 'patching', detail: 'opt-in · disabled',     delay: 3100 },
];

export default function Doctor() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate steps in only when scrolled into view
    const el = document.getElementById('doctor');
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            STEPS.forEach((step, i) => {
              setTimeout(() => setProgress((p) => Math.max(p, i + 1)), step.delay);
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const allOk = progress >= STEPS.length;

  return (
    <section
      id="doctor"
      className="relative py-20 border-t border-border/30"
      data-testid="doctor-section"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3 flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5" /> Read-only diagnostics
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-[1.05]">
              See the SDK boot.{' '}
              <span className="stat-highlight">Before you install.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-balance">
              <code className="font-mono text-foreground bg-card/60 border border-border/50 rounded px-1.5 py-0.5 text-sm">i18nprune doctor</code> verifies every host signal — node, ripgrep, config, paths, target locales — without touching disk. Live preview, running below.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-mono text-primary">
              <Activity className="w-3.5 h-3.5" />
              {allOk ? 'All checks passed · exit 0' : `Running ${progress}/${STEPS.length}`}
            </div>
          </motion.div>

          {/* Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 accent-glow opacity-50 blur-2xl pointer-events-none" aria-hidden="true" />
            <div className="relative rounded-2xl glass-panel overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/70">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-3 text-[11px] font-mono text-muted-foreground">i18nprune doctor</span>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    allOk
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                  data-testid="doctor-status"
                >
                  {allOk ? 'ok' : 'running'}
                </span>
              </div>

              <div className="terminal-bg p-5 font-mono text-[12px] min-h-[280px]">
                <div className="text-foreground/90 mb-2 flex items-baseline gap-2">
                  <span className="text-primary shrink-0">❯</span>
                  <ShikiCode code="i18nprune doctor --json" lang="bash" />
                </div>
                {STEPS.map((s, i) => {
                  const state = i < progress ? 'done' : i === progress ? 'running' : 'pending';
                  return (
                    <div
                      key={s.label}
                      className={`flex items-center justify-between py-1.5 transition-opacity ${
                        state === 'pending' ? 'opacity-30' : 'opacity-100'
                      }`}
                      data-testid={`doctor-step-${s.label}`}
                    >
                      <div className="flex items-center gap-2.5">
                        {state === 'done' && <Check className="w-3 h-3 text-primary shrink-0" />}
                        {state === 'running' && <CircleDashed className="w-3 h-3 text-amber-300 shrink-0 animate-spin" />}
                        {state === 'pending' && <span className="w-3 h-3 inline-block" />}
                        <span className="text-foreground/90">{s.label}</span>
                      </div>
                      <span className="text-muted-foreground">{s.detail}</span>
                    </div>
                  );
                })}

                {allOk && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-3 pt-3 border-t border-border/30 text-primary"
                  >
                    ✓ environment healthy · 6/6 checks passed
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
