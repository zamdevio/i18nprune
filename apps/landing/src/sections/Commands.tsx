import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, RefreshCw, Sparkles, Scissors, FileSearch, Stethoscope, BarChart3, Settings } from 'lucide-react';
import ShikiCode from '../components/ShikiCode';

interface Cmd {
  id: string;
  name: string;
  cat: 'Analysis' | 'Mutation' | 'Output';
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  flags: { flag: string; doc: string }[];
  demo: { line: string; tone?: 'cmd' | 'ok' | 'muted' | 'warn' }[];
}

const COMMANDS: Cmd[] = [
  {
    id: 'validate', name: 'validate', cat: 'Analysis', icon: ShieldCheck,
    desc: 'Scan the codebase for missing keys, drift, and dynamic call sites. The primary CI gate.',
    flags: [
      { flag: '--json', doc: 'Emit structured output for CI / agents.' },
      { flag: '(global) --src, --functions, …', doc: 'Override scan roots and translation helpers; no per-locale --target (always source locale JSON).' },
    ],
    demo: [
      { line: 'i18nprune validate --json', tone: 'cmd' },
      { line: '✓ 1,284 keys · 0 drift · 0 missing', tone: 'ok' },
    ],
  },
  {
    id: 'review', name: 'review', cat: 'Analysis', icon: FileSearch,
    desc: 'Per-locale parity review against source. Pipe JSON into your dashboard.',
    flags: [
      { flag: '--target <codes>', doc: 'all (default), one basename, or comma list (e.g. ja,ar).' },
      { flag: '--json', doc: 'Structured per-locale parity report.' },
    ],
    demo: [
      { line: 'i18nprune review --target fr', tone: 'cmd' },
      { line: 'fr · parity 100% · 0 drift', tone: 'ok' },
    ],
  },
  {
    id: 'doctor', name: 'doctor', cat: 'Analysis', icon: Stethoscope,
    desc: 'Read-only environment diagnostics — Node, ripgrep, paths, and config.',
    flags: [
      { flag: '--only <list>', doc: 'Comma-separated checks: runtime, tools, config, paths (default: all).' },
      { flag: '--strict', doc: 'Treat warnings as failures (exit 1).' },
      { flag: '--json', doc: 'Machine-readable output (global flag).' },
    ],
    demo: [
      { line: 'i18nprune doctor', tone: 'cmd' },
      { line: '✓ node 20.10.0 · ripgrep 14.0 · config OK', tone: 'ok' },
    ],
  },
  {
    id: 'sync', name: 'sync', cat: 'Mutation', icon: RefreshCw,
    desc: 'Align every target locale to source shape. Merge new keys, prune dead, preserve overrides.',
    flags: [
      { flag: '--yes', doc: 'Non-interactive (CI mode).' },
      { flag: '--target <codes>', doc: 'all, comma-separated basenames (ja,pt-br), or omit for all non-source locales.' },
      { flag: '--dry-run', doc: 'List targets only; no file writes.' },
    ],
    demo: [
      { line: 'i18nprune sync --yes', tone: 'cmd' },
      { line: '+ 10 merged · - 12 pruned · 412ms', tone: 'ok' },
    ],
  },
  {
    id: 'generate', name: 'generate', cat: 'Mutation', icon: Sparkles,
    desc: 'AI-powered translation for missing keys. Resume safely; full coverage on demand.',
    flags: [
      { flag: '--resume', doc: 'Top up targets that still mirror source strings.' },
      { flag: '--all', doc: 'With --resume: every non-source locale under localesDir.' },
      { flag: '--target <codes>', doc: 'One code or comma list (not the source basename). Non-interactive runs require --target or --all with --resume.' },
    ],
    demo: [
      { line: 'i18nprune generate --resume --target fr,ja', tone: 'cmd' },
      { line: '✓ 10 translated · 0 errors', tone: 'ok' },
    ],
  },
  {
    id: 'cleanup', name: 'cleanup', cat: 'Mutation', icon: Scissors,
    desc: 'Remove keys that no source file references. Optional ripgrep verification.',
    flags: [
      { flag: '--check-only / --dry-run', doc: 'Preview removals; no writes.' },
      { flag: '--skip-rg', doc: 'Skip ripgrep; static + reference logic only.' },
    ],
    demo: [
      { line: 'i18nprune cleanup --check-only', tone: 'cmd' },
      { line: '- 47 dead keys removed · -12 KB', tone: 'ok' },
    ],
  },
  {
    id: 'report', name: 'report', cat: 'Output', icon: BarChart3,
    desc: 'Export project health — HTML, JSON, CSV, or text. Perfect for dashboards.',
    flags: [
      { flag: '--format <type>', doc: 'html · json · csv · text' },
      { flag: '--out <file>', doc: 'Write to disk instead of stdout.' },
    ],
    demo: [
      { line: 'i18nprune report --format html --out r.html', tone: 'cmd' },
      { line: '✓ wrote r.html · 28 KB', tone: 'ok' },
    ],
  },
  {
    id: 'config', name: 'config', cat: 'Output', icon: Settings,
    desc: 'Show the fully resolved config — env vars merged with file & defaults.',
    flags: [
      { flag: '--json', doc: 'Emit machine-readable resolved config.' },
    ],
    demo: [
      { line: 'i18nprune config --json', tone: 'cmd' },
      { line: '{ "source": "en", "targets": [...] }', tone: 'muted' },
    ],
  },
];

const CAT_ORDER: Cmd['cat'][] = ['Analysis', 'Mutation', 'Output'];

export default function Commands() {
  const [active, setActive] = useState('validate');
  const cmd = COMMANDS.find((c) => c.id === active)!;

  return (
    <section
      id="commands"
      className="relative py-28 border-t border-border/30"
      data-testid="commands-section"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mb-12"
        >
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">
            CLI reference
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Commands{' '}
            <span className="stat-highlight">that explain themselves.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Left: command list */}
          <div className="rounded-2xl glass-panel p-3 max-h-[520px] overflow-y-auto">
            {CAT_ORDER.map((cat) => (
              <div key={cat} className="mb-3 last:mb-0">
                <div className="px-2 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {cat}
                </div>
                {COMMANDS.filter((c) => c.cat === cat).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActive(c.id)}
                    data-testid={`cmd-tab-${c.id}`}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                      active === c.id
                        ? 'bg-primary/10 border border-primary/30 text-foreground'
                        : 'border border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground'
                    }`}
                  >
                    <c.icon className={`w-4 h-4 ${active === c.id ? 'text-primary' : ''}`} />
                    <span className="font-mono text-sm">
                      <span className="text-muted-foreground/70">i18nprune </span>{c.name}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Right: detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={cmd.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl glass-panel p-6"
              data-testid={`cmd-panel-${cmd.id}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <cmd.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{cmd.cat}</div>
                  <h3 className="font-display text-2xl font-bold tracking-tight">
                    <span className="text-muted-foreground/70 font-mono text-base">i18nprune </span>
                    <span className="font-mono">{cmd.name}</span>
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{cmd.desc}</p>

              <div className="mt-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Flags</div>
                <div className="space-y-2">
                  {cmd.flags.map((f) => (
                    <div key={f.flag} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2 border-b border-border/30 last:border-b-0">
                      <code className="font-mono text-sm text-primary shrink-0 min-w-[140px]">{f.flag}</code>
                      <span className="text-sm text-muted-foreground">{f.doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl overflow-hidden border border-border/60 terminal-bg">
                <div className="px-3 py-1.5 border-b border-border/50 bg-card/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                  <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                  <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                  <span className="ml-2 font-mono text-[10px] text-muted-foreground">live preview</span>
                </div>
                <div className="p-4 font-mono text-[12px] space-y-1">
                  {cmd.demo.map((d, i) => (
                    <div
                      key={i}
                      className={
                        d.tone === 'cmd'
                          ? 'text-foreground'
                          : d.tone === 'ok'
                            ? 'text-primary'
                            : d.tone === 'warn'
                              ? 'text-amber-400'
                              : 'text-muted-foreground'
                      }
                    >
                      {d.tone === 'cmd' ? (
                        <span className="flex items-baseline gap-2">
                          <span className="text-primary shrink-0">❯</span>
                          <ShikiCode code={d.line} lang="bash" className="min-w-0 flex-1" />
                        </span>
                      ) : (
                        d.line
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
