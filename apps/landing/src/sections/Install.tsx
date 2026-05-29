import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Terminal as TerminalIcon, Server, Globe2, Cloud, Box, ArrowRight } from 'lucide-react';
import CopyButton from '../components/CopyButton';
import ShikiCode from '../components/ShikiCode';
import { linkHref } from '../lib/meta';
import { useMeta } from '../context/MetaContext';

const MANAGERS = [
  { id: 'npm', cmd: 'npm install --save-dev i18nprune' },
  { id: 'pnpm', cmd: 'pnpm add -D i18nprune' },
  { id: 'yarn', cmd: 'yarn add -D i18nprune' },
];

interface Runtime {
  id: 'node' | 'web' | 'edge';
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  surfaces: string;
}

const RUNTIME_IMPORT_LINE: Record<Runtime['id'], string> = {
  node: "import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';",
  web: "import { createWebRuntimeAdapters } from '@i18nprune/core/runtime/web';",
  edge: "import { createEdgeRuntimeAdapters } from '@i18nprune/core/runtime/edge';",
};

const RUNTIMES: Runtime[] = [
  {
    id: 'node',
    label: 'Node',
    badge: 'CLI · IDE',
    icon: Server,
    surfaces: 'Powers the CLI binary and IDE extensions. Tier B: read + write.',
  },
  {
    id: 'web',
    label: 'Web',
    badge: 'browser bundle',
    icon: Globe2,
    surfaces: 'Backs web.i18nprune.dev & report.i18nprune.dev — playground, explorer & report UI. Tier A.',
  },
  {
    id: 'edge',
    label: 'Edge',
    badge: 'workers · isolates',
    icon: Cloud,
    surfaces: 'Hosts worker.i18nprune.dev/docs Swagger API. Tier A · tree-shake clean.',
  },
];

const STEPS = [
  { n: 1, cmd: 'i18nprune init', desc: 'Initialize config & scan project.' },
  { n: 2, cmd: 'i18nprune validate', desc: 'Detect drift, missing & dynamic keys.' },
  { n: 3, cmd: 'i18nprune sync', desc: 'Align every target locale to source.' },
  { n: 4, cmd: 'ship', desc: 'Gate CI on parity. Ship without surprises.' },
];

export default function Install() {
  const [activeMgr, setActiveMgr] = useState(0);
  const [activeRt, setActiveRt] = useState<Runtime['id']>('node');
  const { links } = useMeta();
  const cur = MANAGERS[activeMgr];
  const runtime = RUNTIMES.find((r) => r.id === activeRt)!;

  return (
    <section
      id="install"
      className="section overflow-hidden"
      data-testid="install-section"
    >
      <div className="absolute inset-0 hero-glow" aria-hidden="true" />
      <div className="absolute inset-0 grid-texture opacity-30" aria-hidden="true" />
      <div className="section-inner-narrow relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">
            Ship it
          </div>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-balance">
            One install.{' '}
            <span className="stat-highlight">Every surface.</span>
          </h2>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-balance">
            One CLI ships the SDK. Pick a runtime to see the matching import path — same engine, three bundles.
          </p>
        </motion.div>

        {/* Install card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-12 rounded-3xl glass-panel p-2 shadow-2xl shadow-black/40"
        >
          <div className="absolute -inset-2 accent-glow opacity-50 blur-2xl pointer-events-none" aria-hidden="true" />
          <div className="relative rounded-2xl overflow-hidden">
            {/* Package manager tabs */}
            <div className="flex items-center gap-1 px-2 pt-2 bg-card/60 border-b border-border/40">
              {MANAGERS.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMgr(i)}
                  data-testid={`install-tab-${m.id}`}
                  className={`relative px-4 py-2 font-mono text-xs rounded-t-md transition-colors ${
                    activeMgr === i ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m.id}
                  {activeMgr === i && (
                    <motion.span
                      layoutId="install-tab"
                      className="absolute inset-x-2 -bottom-px h-0.5 bg-primary rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="terminal-bg px-5 py-6 flex items-center justify-between gap-4 font-mono text-base">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <TerminalIcon className="w-4 h-4 text-primary shrink-0" />
                <div className="flex min-w-0 items-baseline gap-2 truncate">
                  <span className="text-muted-foreground shrink-0">$</span>
                  <ShikiCode code={cur.cmd} lang="bash" className="truncate" />
                </div>
              </div>
              <CopyButton text={cur.cmd} testId="install-copy" />
            </div>
          </div>
        </motion.div>

        {/* Pick your runtime */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 rounded-2xl glass-panel overflow-hidden"
          data-testid="runtime-selector"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/60">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
              Pick your runtime
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/40 p-1">
              {RUNTIMES.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setActiveRt(rt.id)}
                  data-testid={`runtime-tab-${rt.id}`}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                    activeRt === rt.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeRt === rt.id && (
                    <motion.span
                      layoutId="runtime-pill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <rt.icon className="relative w-3 h-3" />
                  <span className="relative">{rt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={runtime.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="px-5 py-5 terminal-bg"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <runtime.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-mono text-[11px] text-foreground">{runtime.label} runtime</span>
                  <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline">· {runtime.badge}</span>
                </div>
                <CopyButton text={RUNTIME_IMPORT_LINE[runtime.id]} testId={`runtime-copy-${runtime.id}`} />
              </div>
              <div className="font-mono text-[12.5px] sm:text-sm leading-relaxed whitespace-pre-wrap break-all">
                <ShikiCode code={RUNTIME_IMPORT_LINE[runtime.id]} lang="typescript" as="div" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{runtime.surfaces}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Quick start sequence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground text-center mb-5">
            Quick start
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="relative rounded-xl border border-border/60 bg-card/40 backdrop-blur-md p-4"
                data-testid={`install-step-${s.n}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-2xl font-bold text-primary/80">0{s.n}</span>
                  {i < STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
                </div>
                <div className="font-mono text-xs mb-1.5">
                  <ShikiCode code={s.cmd} lang="bash" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3"
        >
          <a
            href={linkHref(links, 'webApp')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:scale-[1.02] transition-transform"
            data-testid="install-cta-web"
          >
            <Globe2 className="w-4 h-4" />
            Try in browser
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={linkHref(links, 'workerDocs')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl border border-primary/45 bg-primary/10 text-foreground font-semibold text-sm backdrop-blur-md hover:scale-[1.02] hover:border-primary/70 hover:bg-primary/15 transition-all"
            data-testid="install-cta-worker"
          >
            <Cloud className="w-4 h-4 text-primary" />
            Try Worker (Swagger)
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={linkHref(links, 'sandbox')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl border border-border/70 bg-card/50 hover:border-primary/40 text-sm font-medium transition-all"
            data-testid="install-cta-sandbox"
          >
            <Box className="w-4 h-4" />
            Open in CodeSandbox
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
