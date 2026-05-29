import { motion } from 'motion/react';
import { ShieldCheck, RefreshCw, Sparkles, Scissors, FileSearch, Stethoscope, BarChart3 } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  span?: string;
  detail?: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    id: 'validate',
    title: 'Validate',
    desc: 'Scan source code, detect drift, missing keys, and dynamic call sites.',
    icon: ShieldCheck,
    span: 'lg:col-span-2 lg:row-span-2',
    detail: (
      <div className="font-mono text-[11px] mt-5 space-y-1">
        <div className="text-primary">✓ 1,284 literal keys</div>
        <div className="text-amber-400">⚠ 14 dynamic call sites</div>
        <div className="text-red-400">✗ 10 missing translations</div>
        <div className="text-muted-foreground pt-2">Output: --json · gates CI on parity</div>
      </div>
    ),
  },
  { id: 'sync', title: 'Sync', desc: 'Merge + prune target locales to match the source-of-truth shape.', icon: RefreshCw },
  { id: 'generate', title: 'Generate', desc: 'Auto-translate missing keys via configurable providers, with --resume.', icon: Sparkles },
  { id: 'cleanup', title: 'Cleanup', desc: 'Tree-shake dead keys with optional ripgrep verification.', icon: Scissors },
  { id: 'review', title: 'Review', desc: 'Per-locale parity review with structured JSON for custom tooling.', icon: FileSearch },
  { id: 'doctor', title: 'Doctor', desc: 'Read-only diagnostics for Node, ripgrep, paths, and config.', icon: Stethoscope },
  { id: 'report', title: 'Report', desc: 'Export project health as HTML, JSON, CSV, or plain text.', icon: BarChart3 },
];

export default function Features() {
  return (
    <section
      id="features"
      className="section"
      data-testid="features-section"
    >
      <div className="section-inner">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div className="max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">Capabilities</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              One toolkit.{' '}
              <span className="stat-highlight">Every locale operation.</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Each command is composable, scriptable, and emits structured JSON. Designed to run as a CI gate, a local cleanup pass, or inside an AI agent.
          </p>
        </motion.div>

        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(180px,_auto)] gap-4"
        >
          {FEATURES.map((f) => (
            <motion.article
              key={f.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
              }}
              className={`group relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-5 hover:-translate-y-1 hover:border-primary/40 transition-all shimmer-border ${f.span ?? ''}`}
              data-testid={`feature-${f.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <f.icon className="w-5 h-5" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  i18nprune {f.id}
                </div>
              </div>
              <h3 className="mt-4 font-display font-semibold text-xl tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              {f.detail}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
