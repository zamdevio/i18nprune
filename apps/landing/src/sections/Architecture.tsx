import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCode2,
  Languages,
  Globe2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Scissors,
  FileSearch,
  BarChart3,
  Server,
  Cloud,
  X,
  Box,
  type LucideIcon,
} from 'lucide-react';

type NodeKind = 'input' | 'engine' | 'runtime' | 'outcome';

interface DiagramNode {
  id: string;
  kind: NodeKind;
  title: string;
  sub: string;
  icon: LucideIcon;
  /** centered position in SVG viewBox coordinates */
  x: number;
  y: number;
  /** Real repo path for the detail panel */
  path: string;
  detail: {
    summary: string;
    bullets: string[];
    code: { lang: string; lines: { ln: number; html: React.ReactNode }[] };
  };
}

interface Edge {
  from: string;
  to: string;
  /** Label drawn at midpoint, e.g. "RuntimeContext" */
  label?: string;
  /** Curve direction tweak: positive bows up, negative bows down */
  bow?: number;
  /**
   * 0..1 along the departure edge (east for inputs → SDK, east for SDK → outcomes).
   * Defaults to 0.5 (vertical center of that edge).
   */
  fromAlong?: number;
  /**
   * 0..1 along the arrival edge (west for inputs → SDK, west for SDK → outcomes).
   * Defaults to 0.5.
   */
  toAlong?: number;
}

// Surface-level architecture story — what the SDK does, not how
const NODES: DiagramNode[] = [
  // INPUTS (left column, x=110)
  {
    id: 'src',
    kind: 'input',
    title: 'Source code',
    sub: '.tsx · .vue · .svelte',
    icon: FileCode2,
    x: 110,
    y: 100,
    path: 'your repository',
    detail: {
      summary: 'Every t() call site across your codebase. The SDK statically resolves literal keys, follows import bindings, and flags dynamic call sites separately.',
      bullets: [
        'Patterns scanned: t(), useTranslation(), framework helpers',
        'Per-file constmap binding · alias-aware expansion',
        'Dynamic call sites surface as warnings, never silent',
      ],
      code: {
        lang: 'tsx',
        lines: [
          { ln: 1, html: <><span className="text-pink-400">const</span> {'{ t }'} = <span className="text-sky-300">useTranslation</span>(<span className="text-amber-300">'dashboard'</span>);</> },
          { ln: 2, html: <></> },
          { ln: 3, html: <>{`{t(`}<span className="text-amber-300">'welcome_title'</span>{`)}`}        <span className="text-muted-foreground/60">// literal ✓</span></> },
          { ln: 4, html: <>{`{t(`}<span className="text-amber-300">{'`status.${id}`'}</span>{`)}`}     <span className="text-muted-foreground/60">// dynamic ⚠</span></> },
        ],
      },
    },
  },
  {
    id: 'source-locale',
    kind: 'input',
    title: 'Source locale',
    sub: 'locales/en.json',
    icon: Box,
    x: 110,
    y: 220,
    path: 'locales/<source>.json',
    detail: {
      summary: 'Your source-of-truth locale JSON. The SDK reads its full key shape and uses it as the canonical structure for every target locale.',
      bullets: [
        'Path resolved via i18nprune config or I18NPRUNE_SOURCE env',
        'Nested objects flatten to leaves automatically',
        'Treated as immutable — never auto-mutated unless --auto-fix',
      ],
      code: {
        lang: 'json',
        lines: [
          { ln: 1, html: <><span className="text-foreground/90">{'{'}</span></> },
          { ln: 2, html: <>{'  '}<span className="text-amber-300">"welcome_title"</span>: <span className="text-amber-300">"Welcome back"</span>,</> },
          { ln: 3, html: <>{'  '}<span className="text-amber-300">"nav"</span>: {'{ '}<span className="text-amber-300">"home"</span>: <span className="text-amber-300">"Home"</span>{' }'}</> },
          { ln: 4, html: <>{'}'}</> },
        ],
      },
    },
  },
  {
    id: 'targets',
    kind: 'input',
    title: 'Target locales',
    sub: 'fr · ja · de · pt …',
    icon: Languages,
    x: 110,
    y: 340,
    path: 'locales/<lang>.json',
    detail: {
      summary: 'Every other locale file in your project. The SDK aligns each one to source shape: merging missing keys, optionally preserving overrides, pruning dead ones.',
      bullets: [
        'Configurable via policies.preserve for per-key overrides',
        'sync/review/generate use --target: all, comma-separated basenames, or defaults per command',
        'sync --dry-run lists targets only; no writes',
      ],
      code: {
        lang: 'bash',
        lines: [
          { ln: 1, html: <><span className="text-muted-foreground/60">$</span> i18nprune sync <span className="text-sky-300">--target</span> fr,ja <span className="text-sky-300">--dry-run</span></> },
        ],
      },
    },
  },

  // ENGINE (center, x=400)
  {
    id: 'sdk',
    kind: 'engine',
    title: '@i18nprune/core',
    sub: 'the SDK',
    icon: Sparkles,
    x: 400,
    y: 220,
    path: 'packages/core',
    detail: {
      summary: 'The runtime-neutral SDK. Deterministic engines for extraction, comparison, translation, and reporting. Same algorithms across CLI, IDE, browser, and worker hosts.',
      bullets: [
        'Stable programmatic API · types-first',
        'Runtime-neutral · ships node, web, and edge adapters',
        'Powers 4 live surfaces today (CLI · web · report · worker) — IDE extension coming soon',
      ],
      code: {
        lang: 'ts',
        lines: [
          { ln: 1, html: <><span className="text-pink-400">import</span> {'{ '}<span className="text-sky-300">createCoreContext</span>, <span className="text-sky-300">runValidate</span>{' }'}</> },
          { ln: 2, html: <>  <span className="text-pink-400">from</span> <span className="text-amber-300">'@i18nprune/core'</span>;</> },
          { ln: 3, html: <><span className="text-pink-400">import</span> {'{ '}<span className="text-sky-300">createNodeRuntimeAdapters</span>{' }'}</> },
          { ln: 4, html: <>  <span className="text-pink-400">from</span> <span className="text-amber-300">'@i18nprune/core/runtime/node'</span>;</> },
          { ln: 5, html: <></> },
          { ln: 6, html: <><span className="text-pink-400">const</span> ctx = <span className="text-sky-300">createCoreContext</span>(<span className="text-foreground/90">{'{'} </span>config, adapters: <span className="text-sky-300">createNodeRuntimeAdapters</span>(), … <span className="text-foreground/90">{' }'}</span>);</> },
        ],
      },
    },
  },

  // RUNTIME BRANCHES (small chips around SDK)
  {
    id: 'rt-node',
    kind: 'runtime',
    title: 'Node',
    sub: 'CLI · IDE soon',
    icon: Server,
    x: 400,
    y: 100,
    path: '@i18nprune/core/runtime/node',
    detail: {
      summary: 'Node runtime adapter. Backs the CLI binary today; IDE extension (Cursor / VS Code) coming soon. Native fs + path bindings, durable disk writes for Tier B operations.',
      bullets: [
        'Tier B · read + write',
        'Used by: packages/cli · IDE extension (coming soon)',
        'node: imports allowed inside this graph only',
      ],
      code: {
        lang: 'ts',
        lines: [
          { ln: 1, html: <><span className="text-pink-400">import</span> {'{ '}<span className="text-sky-300">createNodeRuntimeAdapters</span>{' }'}</> },
          { ln: 2, html: <>  <span className="text-pink-400">from</span> <span className="text-amber-300">'@i18nprune/core/runtime/node'</span>;</> },
        ],
      },
    },
  },
  {
    id: 'rt-web',
    kind: 'runtime',
    title: 'Web',
    sub: 'browser bundle',
    icon: Globe2,
    x: 280,
    y: 360,
    path: '@i18nprune/core/runtime/web',
    detail: {
      summary: 'Browser runtime adapter. Powers web.i18nprune.dev (playground & explorer) and report.i18nprune.dev (report UI & share links). Filesystem behaviors stream via fetch / virtual FS.',
      bullets: [
        'Tier A · read / analyze',
        'No node: imports in this bundle graph',
        'User-supplied projects via upload / paste',
      ],
      code: {
        lang: 'ts',
        lines: [
          { ln: 1, html: <><span className="text-pink-400">import</span> {'{ '}<span className="text-sky-300">createWebRuntimeAdapters</span>{' }'}</> },
          { ln: 2, html: <>  <span className="text-pink-400">from</span> <span className="text-amber-300">'@i18nprune/core/runtime/web'</span>;</> },
        ],
      },
    },
  },
  {
    id: 'rt-edge',
    kind: 'runtime',
    title: 'Edge',
    sub: 'workers / isolates',
    icon: Cloud,
    x: 520,
    y: 360,
    path: '@i18nprune/core/runtime/edge',
    detail: {
      summary: 'Edge runtime adapter. Powers worker.i18nprune.dev (Cloudflare Workers, Deno Deploy, Lambda@Edge). Strict bundle hygiene, no node: symbols.',
      bullets: [
        'Tier A · read / analyze',
        'Hosts worker.i18nprune.dev/docs Swagger API',
        'Tree-shake clean — Worker bundle audited',
      ],
      code: {
        lang: 'ts',
        lines: [
          { ln: 1, html: <><span className="text-pink-400">import</span> {'{ '}<span className="text-sky-300">createEdgeRuntimeAdapters</span>{' }'}</> },
          { ln: 2, html: <>  <span className="text-pink-400">from</span> <span className="text-amber-300">'@i18nprune/core/runtime/edge'</span>;</> },
        ],
      },
    },
  },

  // OUTCOMES (right, x=720)
  {
    id: 'validate',
    kind: 'outcome',
    title: 'Validate',
    sub: 'drift + missing',
    icon: ShieldCheck,
    x: 720,
    y: 70,
    path: 'i18nprune validate',
    detail: {
      summary: 'Scan source against locale shape. Report literal mismatches and dynamic call sites. Block PRs that ship broken keys.',
      bullets: [
        'JSON envelope: data.count · data.missing · data.dynamic.count',
        'Uses config source locale only (no --target on this command)',
        'CI-ready: global --json, --quiet, --silent',
      ],
      code: {
        lang: 'json',
        lines: [
          { ln: 1, html: <span>{'{ '}<span className="text-amber-300">"command"</span>: <span className="text-amber-300">"validate"</span>, <span className="text-amber-300">"data"</span>: {'{ "count": 1284, "missing": [], "dynamic": { "count": 14 } } }'}</span> },
        ],
      },
    },
  },
  {
    id: 'sync',
    kind: 'outcome',
    title: 'Sync',
    sub: 'merge + prune',
    icon: RefreshCw,
    x: 720,
    y: 145,
    path: 'i18nprune sync',
    detail: {
      summary: 'Align every target locale to source shape. Merge new keys, optionally preserve overrides, prune dead ones.',
      bullets: [
        '--yes for non-interactive CI runs',
        '--target all, comma list, or omit for every non-source locale',
        '--dry-run to preview without writing',
      ],
      code: {
        lang: 'bash',
        lines: [
          { ln: 1, html: <><span className="text-muted-foreground/60">$</span> i18nprune sync <span className="text-sky-300">--yes</span></> },
        ],
      },
    },
  },
  {
    id: 'generate',
    kind: 'outcome',
    title: 'Generate',
    sub: 'AI translations',
    icon: Sparkles,
    x: 720,
    y: 220,
    path: 'i18nprune generate',
    detail: {
      summary: 'Machine-translate missing keys via the configured provider. --resume tops up safely; --all covers every non-source locale.',
      bullets: [
        'Provider: Google gtx today (pluggable)',
        '--resume only fills gaps',
        'BCP-47 codes from bundled catalog',
      ],
      code: {
        lang: 'bash',
        lines: [
          { ln: 1, html: <><span className="text-muted-foreground/60">$</span> i18nprune generate <span className="text-sky-300">--resume --all</span></> },
        ],
      },
    },
  },
  {
    id: 'cleanup',
    kind: 'outcome',
    title: 'Cleanup',
    sub: 'dead keys out',
    icon: Scissors,
    x: 720,
    y: 295,
    path: 'i18nprune cleanup',
    detail: {
      summary: 'Tree-shake unused keys with optional ripgrep verification and interactive confirmations. The translation equivalent of dead code elimination.',
      bullets: [
        '--check-only or --dry-run: preview removals, no writes',
        'Ripgrep on by default; --skip-rg for static-only unused keys',
        'Interactive --ask unless global --yes in CI',
      ],
      code: {
        lang: 'bash',
        lines: [
          { ln: 1, html: <><span className="text-muted-foreground/60">$</span> i18nprune cleanup <span className="text-sky-300">--check-only</span></> },
        ],
      },
    },
  },
  {
    id: 'review',
    kind: 'outcome',
    title: 'Review',
    sub: 'parity per locale',
    icon: FileSearch,
    x: 720,
    y: 370,
    path: 'i18nprune review',
    detail: {
      summary: 'Per-locale parity audit against source. Structured JSON output flows into dashboards, Slack, or AI agents.',
      bullets: [
        'parity score 0..1 per language',
        'Drift signals: missing · extra · dynamic',
        'Available without a config file',
      ],
      code: {
        lang: 'bash',
        lines: [
          { ln: 1, html: <><span className="text-muted-foreground/60">$</span> i18nprune review <span className="text-sky-300">--target</span> fr <span className="text-sky-300">--json</span></> },
        ],
      },
    },
  },
  {
    id: 'report',
    kind: 'outcome',
    title: 'Report',
    sub: 'HTML · JSON · CSV',
    icon: BarChart3,
    x: 720,
    y: 445,
    path: 'i18nprune report',
    detail: {
      summary: 'Project health export. Ship to your docs site, attach to PRs, or pipe into custom tooling.',
      bullets: [
        '--format html / json / csv / text',
        'Optional --json stdout envelope',
        'Per-call-site literals included',
      ],
      code: {
        lang: 'bash',
        lines: [
          { ln: 1, html: <><span className="text-muted-foreground/60">$</span> i18nprune report <span className="text-sky-300">--format</span> html <span className="text-sky-300">--out</span> health.html</> },
        ],
      },
    },
  },
];

const EDGES: Edge[] = [
  // Inputs → SDK (west ports spaced so Source code / Source locale cables stay parallel)
  { from: 'src', to: 'sdk', label: 'AST scan', toAlong: 0.22 },
  { from: 'source-locale', to: 'sdk', label: 'shape', toAlong: 0.45 },
  { from: 'targets', to: 'sdk', label: 'merge plan', toAlong: 0.78 },
  // SDK ↔ runtimes — bow avoids degenerate vertical beziers (Node above hub shared x with SDK)
  { from: 'sdk', to: 'rt-node', bow: 1 },
  { from: 'sdk', to: 'rt-web', bow: -28 },
  { from: 'sdk', to: 'rt-edge', bow: 28 },
  // SDK → outcomes (east ports; sync/generate fromAlong swapped so those two chords do not cross)
  { from: 'sdk', to: 'validate', fromAlong: 0.08 },
  { from: 'sdk', to: 'sync', fromAlong: 0.26 },
  { from: 'sdk', to: 'generate', fromAlong: 0.42 },
  { from: 'sdk', to: 'cleanup', fromAlong: 0.62 },
  { from: 'sdk', to: 'review', fromAlong: 0.78 },
  { from: 'sdk', to: 'report', fromAlong: 0.93 },
];

const PHASES = [
  { id: 'inputs', label: 'Inputs', tip: 'Source code + locale files' },
  { id: 'sdk', label: 'SDK', tip: '@i18nprune/core' },
  { id: 'runtime', label: 'Runtimes', tip: 'Node · Web · Edge' },
  { id: 'outcomes', label: 'Outcomes', tip: 'Six command results' },
] as const;

function nodeSize(kind: NodeKind) {
  switch (kind) {
    case 'engine': return { w: 200, h: 92 };
    case 'runtime': return { w: 130, h: 50 };
    case 'outcome': return { w: 140, h: 58 };
    default: return { w: 170, h: 70 };
  }
}

function kindStyle(kind: NodeKind, active: boolean) {
  if (active) return 'border-primary/70 bg-card/50 backdrop-blur-xl shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.5)]';
  switch (kind) {
    case 'engine': return 'border-primary/45 bg-card/35 backdrop-blur-xl';
    case 'runtime': return 'border-sky-500/35 bg-card/30 backdrop-blur-xl';
    case 'outcome': return 'border-border/55 bg-card/32 backdrop-blur-xl';
    default: return 'border-amber-500/30 bg-card/35 backdrop-blur-xl';
  }
}

function iconAccent(kind: NodeKind) {
  switch (kind) {
    case 'engine': return 'text-primary';
    case 'runtime': return 'text-sky-300';
    case 'outcome': return 'text-foreground';
    default: return 'text-amber-300';
  }
}

function edgeEnds(e: Edge, a: DiagramNode, b: DiagramNode) {
  const { w: aw, h: ah } = nodeSize(a.kind);
  const { w: bw, h: bh } = nodeSize(b.kind);
  const fromT = e.fromAlong ?? 0.5;
  const toT = e.toAlong ?? 0.5;

  if (a.kind === 'input' && b.id === 'sdk') {
    return {
      ax: a.x + aw / 2,
      ay: a.y - ah / 2 + ah * fromT,
      bx: b.x - bw / 2,
      by: b.y - bh / 2 + bh * toT,
    };
  }
  if (a.id === 'sdk' && b.kind === 'outcome') {
    return {
      ax: a.x + aw / 2,
      ay: a.y - ah / 2 + ah * fromT,
      bx: b.x - bw / 2,
      by: b.y - bh / 2 + bh * toT,
    };
  }
  return { ax: a.x, ay: a.y, bx: b.x, by: b.y };
}

export default function Architecture() {
  const [active, setActive] = useState<string>('sdk');
  const activeNode = NODES.find((n) => n.id === active) ?? null;

  function midPath(ax: number, ay: number, bx: number, by: number, bow = 0) {
    const dx0 = bx - ax;
    const dy0 = by - ay;
    // Near-horizontal: control points sit on the chord → invisible with dash + blur; bow on Y.
    const horizontalish = Math.abs(dy0) < 3 && Math.abs(dx0) > 40;
    // Near-vertical: bow on X (Node ↔ SDK).
    const verticalish = Math.abs(dx0) < 3 && Math.abs(dy0) > 40;

    if (horizontalish) {
      const bumpY = -36;
      const t = 0.38;
      const c1x = ax + dx0 * t;
      const c1y = ay + bumpY;
      const c2x = bx - dx0 * t;
      const c2y = by + bumpY;
      return `M ${ax} ${ay} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${bx} ${by}`;
    }
    if (verticalish) {
      const dx = dx0 * 0.5 + bow;
      const c1x = ax + dx;
      const c1y = ay;
      const c2x = bx - dx;
      const c2y = by;
      return `M ${ax} ${ay} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${bx} ${by}`;
    }
    const dx = dx0 * 0.5 + bow;
    const c1x = ax + dx;
    const c1y = ay;
    const c2x = bx - dx;
    const c2y = by;
    return `M ${ax} ${ay} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${bx} ${by}`;
  }

  return (
    <section
      id="architecture"
      className="section overflow-hidden"
      data-testid="architecture-section"
    >
      <div className="absolute inset-0 grid-texture opacity-30" aria-hidden="true" />
      <div className="section-inner relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div className="max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">
              The blueprint
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              Source code in.{' '}
              <span className="stat-highlight">Confidence out.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-balance">
              Three inputs feed a single SDK. One SDK powers four live surfaces plus an IDE extension on the way, across three runtimes. Six commands return structured outcomes you can ship to CI, agents, or dashboards.
            </p>
            <a
              href="#locale-layouts"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              data-testid="architecture-locale-layouts-link"
            >
              How locale layouts map to disk
              <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {PHASES.map((p, i) => (
              <span key={p.id} className="flex items-center gap-3">
                <span>{p.label}</span>
                {i < PHASES.length - 1 && <span className="text-border">→</span>}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Blueprint diagram */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl blueprint-shell border border-border/50 p-2 sm:p-3 shadow-[0_25px_80px_-24px_hsl(var(--primary)/0.14)]"
          data-testid="architecture-blueprint"
        >
          {/* phase column labels overlaid on diagram */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" aria-hidden="true" />
            <div className="absolute inset-0 hero-glow opacity-30 pointer-events-none" aria-hidden="true" />

            <p className="md:hidden px-1 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Scroll diagram →
            </p>
            <div className="landing-scroll-x rounded-xl md:overflow-visible">
              <svg viewBox="0 0 870 520" className="block w-[820px] max-w-none md:w-full md:max-w-full md:h-auto">
                <defs>
                  <linearGradient id="edge-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                  </linearGradient>
                  <radialGradient id="sdk-aura" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </radialGradient>
                  <filter id="arch-edge-soft" x="-15%" y="-15%" width="130%" height="130%">
                    <feGaussianBlur stdDeviation="1.25" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Phase column dividers */}
                {[230, 590].map((x, i) => (
                  <line
                    key={i}
                    x1={x} y1="20" x2={x} y2="500"
                    stroke="hsl(var(--border))"
                    strokeOpacity="0.4"
                    strokeDasharray="2 6"
                  />
                ))}

                {/* Phase headers */}
                <g fontFamily="'JetBrains Mono', monospace" fontSize="9.5" letterSpacing="2" textAnchor="middle" fill="hsl(var(--muted-foreground))">
                  <text x="110" y="32">INPUTS</text>
                  <text x="400" y="32">SDK · @i18nprune/core</text>
                  <text x="720" y="32">OUTCOMES</text>
                </g>

                {/* SDK aura */}
                <circle cx="400" cy="220" r="160" fill="url(#sdk-aura)" />

                {/* Edges */}
                {EDGES.map((e, i) => {
                  const a = NODES.find((n) => n.id === e.from)!;
                  const b = NODES.find((n) => n.id === e.to)!;
                  const { ax, ay, bx, by } = edgeEnds(e, a, b);
                  const path = midPath(ax, ay, bx, by, e.bow ?? 0);
                  const isHi = active === e.from || active === e.to;
                  return (
                    <g key={`edge-${i}`}>
                      <motion.path
                        d={path}
                        fill="none"
                        stroke={isHi ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.45)'}
                        strokeWidth={isHi ? 1.6 : 1}
                        strokeDasharray="3 5"
                        filter="url(#arch-edge-soft)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 1.1, delay: 0.4 + i * 0.05, ease: 'easeInOut' }}
                      />
                      {/* Traveling dot */}
                      <circle r={isHi ? 3 : 2.4} fill="hsl(var(--primary))" opacity={isHi ? 1 : 0.85}>
                        <animateMotion dur={`${2.4 + (i % 3) * 0.5}s`} repeatCount="indefinite" path={path} begin={`${0.4 + i * 0.18}s`} />
                        <animate attributeName="opacity" values="0;1;1;0" dur={`${2.4 + (i % 3) * 0.5}s`} repeatCount="indefinite" />
                      </circle>
                      {e.label && (
                        <motion.g
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 1.0 + i * 0.05 }}
                        >
                          <rect
                            x={(ax + bx) / 2 - 28}
                            y={(ay + by) / 2 - 8}
                            width="56"
                            height="16"
                            rx="8"
                            fill="hsl(var(--background))"
                            stroke="hsl(var(--border))"
                            strokeOpacity={0.6}
                          />
                          <text
                            x={(ax + bx) / 2}
                            y={(ay + by) / 2 + 3.2}
                            textAnchor="middle"
                            fontFamily="'JetBrains Mono', monospace"
                            fontSize="8.5"
                            fill="hsl(var(--muted-foreground))"
                          >
                            {e.label}
                          </text>
                        </motion.g>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {NODES.map((n, i) => {
                  const { w, h } = nodeSize(n.kind);
                  const isActive = active === n.id;
                  return (
                    <motion.g
                      key={n.id}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.45, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      onMouseEnter={() => setActive(n.id)}
                      onClick={() => setActive(n.id)}
                      style={{ cursor: 'pointer' }}
                      data-testid={`arch-node-${n.id}`}
                    >
                      <foreignObject
                        x={n.x - w / 2}
                        y={n.y - h / 2}
                        width={w}
                        height={h}
                        style={{ overflow: 'hidden', borderRadius: '0.75rem' }}
                      >
                        <div
                          className={`w-full h-full overflow-hidden rounded-xl border backdrop-blur-md px-3 py-2 transition-all ${kindStyle(n.kind, isActive)}`}
                        >
                          <div className="flex items-center gap-2.5 h-full">
                            <div
                              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${iconAccent(n.kind)} ${isActive ? 'bg-primary/20 ring-1 ring-primary/35' : 'bg-background/60'} border border-border/60`}
                            >
                              {n.kind === 'engine' ? (
                                <img src="/i18nprune.svg" alt="" className="w-6 h-6 rounded-md" aria-hidden />
                              ) : (
                                <n.icon className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-[12px] font-semibold leading-tight truncate ${n.kind === 'engine' ? 'text-foreground font-display' : 'text-foreground'}`}>
                                {n.title}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground truncate">
                                {n.sub}
                              </div>
                              {n.kind === 'engine' && (
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-mono uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                                  SDK
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </foreignObject>
                    </motion.g>
                  );
                })}
              </svg>
            </div>

            <div className="md:hidden mt-4 border-t border-border/40 pt-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Explore nodes
              </p>
              <div className="landing-scroll-x flex gap-2 pb-1">
                {NODES.map((n) => {
                  const isActive = active === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setActive(n.id)}
                      className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left transition-colors ${
                        isActive
                          ? 'border-primary/40 bg-primary/10 text-foreground'
                          : 'border-border/50 bg-card/40 text-muted-foreground hover:text-foreground'
                      }`}
                      data-testid={`arch-mobile-node-${n.id}`}
                    >
                      <n.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono text-[11px] whitespace-nowrap">{n.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {activeNode && (
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5"
            >
              <div className="rounded-2xl glass-panel grid lg:grid-cols-[1fr_1.1fr] gap-0 overflow-hidden">
                <div className="p-6 border-b lg:border-b-0 lg:border-r border-border/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/80 mb-2 flex items-center gap-2">
                        {activeNode.kind === 'engine' ? (
                          <img src="/i18nprune.svg" alt="" className="w-3.5 h-3.5 rounded" aria-hidden />
                        ) : (
                          <activeNode.icon className="w-3.5 h-3.5" />
                        )}
                        {activeNode.kind}
                      </div>
                      <h3 className="font-display text-2xl font-bold tracking-tight">
                        {activeNode.title}
                      </h3>
                      <code className="block mt-1 font-mono text-[11px] text-muted-foreground break-all">
                        {activeNode.path}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActive('sdk')}
                      aria-label="Reset to SDK"
                      className="shrink-0 w-7 h-7 rounded-full border border-border/40 bg-card/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                      data-testid="arch-detail-reset"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {activeNode.detail.summary}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {activeNode.detail.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/90">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <code className="font-mono text-[12px]">{b}</code>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="terminal-bg p-5 font-mono text-[12px] leading-relaxed">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                    <span>Usage · {activeNode.detail.code.lang}</span>
                    {activeNode.kind === 'engine' && (
                      <span className="text-primary">@i18nprune/core SDK</span>
                    )}
                  </div>
                  {activeNode.detail.code.lines.map((l) => (
                    <div key={l.ln} className="flex">
                      <span className="select-none w-7 text-right pr-3 text-muted-foreground/40">{l.ln}</span>
                      <span className="flex-1">{l.html}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
