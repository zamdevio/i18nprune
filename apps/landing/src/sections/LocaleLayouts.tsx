import { motion } from 'motion/react';
import { FolderTree, FileJson, Layers, AlertTriangle, ArrowDown } from 'lucide-react';

interface LayoutRow {
  mode: string;
  structure: string;
  example: string;
  blurb: string;
}

const LAYOUTS: LayoutRow[] = [
  {
    mode: 'flat_file',
    structure: 'locale_file',
    example: 'locales/en.json · locales/fr.json',
    blurb: 'One JSON file per locale — ideal for small apps and starter templates.',
  },
  {
    mode: 'locale_directory',
    structure: 'locale_per_dir',
    example: 'messages/en/common.json · messages/fr/auth.json',
    blurb: 'One folder per locale code; split keys across segment files inside each.',
  },
  {
    mode: 'locale_directory',
    structure: 'feature_bundle',
    example: 'messages/auth/en.json · messages/auth/fr.json',
    blurb: 'Feature folders with locale basenames — namespace-first trees (i18next-style bundles).',
  },
];

const MODES = [
  {
    id: 'flat_file',
    title: 'flat_file',
    desc: 'Locale codes are file basenames directly under your configured directory.',
    when: 'Default for monolithic JSON per language.',
  },
  {
    id: 'locale_directory',
    title: 'locale_directory',
    desc: 'Locales live in per-language directories with one or more segment files each.',
    when: 'When you outgrow a single file — auth, common, marketing, and more.',
  },
] as const;

export default function LocaleLayouts() {
  return (
    <section
      id="locale-layouts"
      className="section overflow-hidden"
      data-testid="locale-layouts-section"
    >
      <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" aria-hidden="true" />
      <div className="section-inner relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mb-12"
        >
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">
            Locale layouts
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Your disk shape,{' '}
            <span className="stat-highlight">one config.</span>
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed text-balance">
            Set <code className="font-mono text-foreground bg-card/60 border border-border/50 rounded px-1.5 py-0.5 text-sm">locales.mode</code> and{' '}
            <code className="font-mono text-foreground bg-card/60 border border-border/50 rounded px-1.5 py-0.5 text-sm">locales.structure</code> once.
            The SDK, CLI, web upload, and worker all enumerate and read the same tree — no host-specific guessing.
          </p>
        </motion.div>

        {/* Modes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="grid sm:grid-cols-2 gap-4 mb-10"
        >
          {MODES.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-5"
              data-testid={`locale-mode-${m.id}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileJson className="w-4 h-4 text-primary" />
                <code className="font-mono text-sm font-semibold text-foreground">{m.title}</code>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              <p className="mt-3 text-[13px] text-foreground/90">{m.when}</p>
            </article>
          ))}
        </motion.div>

        {/* Structures table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl glass-panel overflow-hidden mb-10"
          data-testid="locale-layouts-table"
        >
          <div className="px-5 py-4 border-b border-border/40 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            mode + structure → on-disk layout
          </div>
          <div className="divide-y divide-border/40">
            {LAYOUTS.map((row) => (
              <div
                key={`${row.mode}-${row.structure}`}
                className="flex flex-col gap-3 px-4 py-4 sm:px-5 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)] md:gap-6 md:items-start"
              >
                <div className="flex flex-wrap gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25">
                    {row.mode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-card/80 text-foreground border border-border/50">
                    {row.structure}
                  </span>
                </div>
                <code className="font-mono text-[12px] text-muted-foreground break-all">{row.example}</code>
                <p className="text-sm text-foreground/90 leading-relaxed">{row.blurb}</p>
              </div>
            ))}
          </div>
          <p className="px-5 py-3 text-[12px] text-muted-foreground border-t border-border/40 bg-card/20">
            With <code className="font-mono text-foreground/90">locale_directory</code>, you must set{' '}
            <code className="font-mono text-foreground/90">structure</code> explicitly — the tool does not guess between{' '}
            <code className="font-mono text-foreground/90">locale_per_dir</code> and{' '}
            <code className="font-mono text-foreground/90">feature_bundle</code>.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Nested segments */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-border/60 bg-card/35 backdrop-blur-xl p-5"
            data-testid="locale-nested-segments"
          >
            <div className="flex items-center gap-2 mb-4">
              <FolderTree className="w-4 h-4 text-amber-300" />
              <h3 className="font-display text-lg font-semibold tracking-tight">Nested segments</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Under <code className="font-mono text-foreground text-[12px]">locale_directory</code>, each locale can span
              multiple JSON files — logical keys merge across segments while keeping stable file boundaries for teams and
              reviews.
            </p>
            <div className="terminal-bg rounded-xl p-4 font-mono text-[11px] leading-relaxed space-y-0.5">
              <div className="text-muted-foreground/70">messages/</div>
              <div className="pl-3">
                en/
                <ArrowDown className="inline w-3 h-3 mx-1 text-primary/70" aria-hidden />
              </div>
              <div className="pl-6 text-amber-300/90">auth.json</div>
              <div className="pl-6 text-amber-300/90">common.json</div>
              <div className="pl-3 text-muted-foreground/60">fr/ …</div>
            </div>
            <p className="mt-4 text-[12px] text-muted-foreground">
              Example path: <code className="font-mono text-foreground/90">messages/en/auth.json</code>
            </p>
          </motion.div>

          {/* Depth + read behavior */}
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-border/60 bg-card/35 backdrop-blur-xl p-5"
              data-testid="locale-depth-limit"
            >
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-sky-300" />
                <h3 className="font-display text-lg font-semibold tracking-tight">Depth limit</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Segment trees are walked up to{' '}
                <code className="font-mono text-foreground text-[12px]">MAX_LOCALE_SEGMENT_TREE_DEPTH = 16</code> levels
                under your configured locales root — enough for deep feature folders without unbounded scans.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-xl p-5"
              data-testid="locale-read-behavior"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <h3 className="font-display text-lg font-semibold tracking-tight">Stray paths</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Files that do not match your configured <code className="font-mono text-foreground text-[12px]">mode</code> +{' '}
                <code className="font-mono text-foreground text-[12px]">structure</code> emit{' '}
                <code className="font-mono text-foreground text-[12px]">locale_read_path_layout_mismatch</code>: warn, skip
                that path, and continue. Your config stays authoritative — no hard stop for leftover JSON in the tree.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
