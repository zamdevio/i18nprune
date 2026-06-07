import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, AlertTriangle, Cpu, MessageSquareOff } from 'lucide-react';
import CountUp from '../components/CountUp';

type KeyEntryType = 'literal' | 'dynamic' | 'commented';

interface KeyEntry {
  key: string;
  label: string;
  type: KeyEntryType;
  line: number;
}

const KEYS: KeyEntry[] = [
  { key: 'legacy.banner', label: 'legacy.banner', type: 'commented', line: 6 },
  { key: 'welcome_title', label: 'welcome_title', type: 'literal', line: 8 },
  { key: 'dashboard.active_users', label: 'dashboard.active_users', type: 'literal', line: 9 },
  { key: 'dashboard.statuses.*', label: 'dashboard.statuses.*', type: 'dynamic', line: 10 },
];

const CODE_LINES = [
  {
    ln: 1,
    content: (
      <>
        <span className="text-pink-400">import</span> {'{ '}
        <span className="text-sky-300">t</span> <span className="text-pink-400">as</span> <span className="text-sky-300">renameT</span>
        {' }'} <span className="text-pink-400">from</span> <span className="text-amber-300">&apos;@/i18n&apos;</span>;
      </>
    ),
  },
  {
    ln: 2,
    content: (
      <>
        <span className="text-pink-400">import</span> <span className="text-pink-400">*</span> <span className="text-pink-400">as</span>{' '}
        <span className="text-sky-300">i18n</span> <span className="text-pink-400">from</span> <span className="text-amber-300">&apos;@/i18n&apos;</span>;
      </>
    ),
  },
  { ln: 3, content: <></> },
  {
    ln: 4,
    content: (
      <>
        <span className="text-pink-400">export function</span> <span className="text-sky-300">Dashboard</span>({'{ '}
        <span className="text-sky-300">status</span>{' '}
        {'}: {'}
        <span className="text-sky-300">{'{ status: string }'}</span>
        {' ) {'}
      </>
    ),
  },
  {
    ln: 5,
    content: (
      <>
        {'  '}
        <span className="text-pink-400">const</span> <span className="text-sky-300">NS</span> = <span className="text-amber-300">&apos;dashboard&apos;</span>;
      </>
    ),
  },
  {
    ln: 6,
    content: (
      <>
        {'  '}
        <span className="text-muted-foreground/55">{'// '}</span>
        <span
          className="bg-muted/50 text-muted-foreground/80 px-1 rounded-sm line-through decoration-muted-foreground/40"
          data-key="legacy.banner"
        >
          {'renameT('}
          <span className="text-amber-300/80">&apos;legacy.banner&apos;</span>
          {');'}
        </span>
      </>
    ),
  },
  { ln: 7, content: <>  <span className="text-pink-400">return</span> (</> },
  {
    ln: 8,
    content: (
      <>
        {'    '}
        {'<h1>'}
        <span className="bg-primary/10 text-primary px-1 rounded-sm" data-key="welcome_title">
          {'{renameT('}
          <span className="text-amber-300">&apos;welcome_title&apos;</span>
          {')}'}</span>
        {'</h1>'}
      </>
    ),
  },
  {
    ln: 9,
    content: (
      <>
        {'    '}
        {'<p>'}
        <span className="bg-primary/10 text-primary px-1 rounded-sm" data-key="dashboard.active_users">
          {'{i18n.t('}
          <span className="text-amber-300">{'`${NS}.active_users`'}</span>
          {')}'}</span>
        {'</p>'}
      </>
    ),
  },
  {
    ln: 10,
    content: (
      <>
        {'    '}
        {'<span>'}
        <span className="bg-amber-500/10 text-amber-300 px-1 rounded-sm" data-key="dashboard.statuses.*">
          {'{renameT('}
          <span className="text-amber-300">{'`${NS}.statuses.${status}`'}</span>
          {')}'}</span>
        {'</span>'}
      </>
    ),
  },
  { ln: 11, content: <>  );</> },
  { ln: 12, content: <>{'}'}</> },
];

function keyTypeTone(type: KeyEntryType): { text: string; badge: string } {
  if (type === 'literal') return { text: 'text-foreground', badge: 'text-primary' };
  if (type === 'dynamic') return { text: 'text-amber-300', badge: 'text-amber-400' };
  return { text: 'text-muted-foreground', badge: 'text-muted-foreground' };
}

function KeyTypeBadge({ type }: { type: KeyEntryType }) {
  const tone = keyTypeTone(type);
  if (type === 'literal') {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${tone.badge}`}>
        <Check className="w-3 h-3" />
        literal
      </span>
    );
  }
  if (type === 'dynamic') {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${tone.badge}`}>
        <AlertTriangle className="w-3 h-3" />
        dynamic
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${tone.badge}`}>
      <MessageSquareOff className="w-3 h-3" />
      commented
    </span>
  );
}

export default function CodeIntelligence() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          setScanning(true);
          obs.disconnect();
          KEYS.forEach((_, i) => {
            setTimeout(() => setRevealed(i + 1), 800 + i * 600);
          });
        }
      }),
      { threshold: 0.4 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const lineSpan =
    revealed > 0
      ? `L${KEYS[0]!.line}–L${KEYS[KEYS.length - 1]!.line}`
      : 'L-';

  return (
    <section
      id="code-intelligence"
      className="section"
      data-testid="code-intelligence-section"
    >
      <div className="section-inner">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mb-12"
        >
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" /> Static analysis
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Compiler-grade{' '}
            <span className="stat-highlight">key extraction.</span>
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed text-balance">
            Per-file scanning resolves literals on every effective helper—renamed imports like{' '}
            <code className="font-mono text-primary text-sm">t as renameT</code>, namespace calls like{' '}
            <code className="font-mono text-primary text-sm">i18n.t(...)</code>, and{' '}
            <code className="font-mono text-primary text-sm">{['`${NS}.key`'].join('')}</code> when{' '}
            <code className="font-mono text-primary text-sm">NS</code> is in the file const-map. Runtime holes like{' '}
            <code className="font-mono text-primary text-sm">{['`${NS}.statuses.${status}`'].join('')}</code> stay dynamic.
            A binding pass expands your configured function list before call-site detection,
            so extraction and dynamic classification share the same symbol set as{' '}
            <code className="font-mono text-foreground/90 text-xs">validate</code> /{' '}
            <code className="font-mono text-foreground/90 text-xs">sync</code>—via staged text analysis,
            not a full TypeScript program checker.
          </p>
          <div className="mt-8 rounded-xl border border-border/50 bg-card/25 backdrop-blur-md px-4 py-3 text-sm text-muted-foreground leading-relaxed">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/90">Extractor architecture</span>
            <p className="mt-2 text-[13px]">
              Three layers feed the scanner: <span className="text-foreground font-semibold">import binding</span> (ESM/CJS aliases and{' '}
              <code className="font-mono text-xs text-foreground/90">* as</code> namespaces with <code className="font-mono text-xs text-foreground/90">.t</code>),{' '}
              <span className="text-foreground font-semibold">const-map</span> for per-file constants, and{' '}
              <span className="text-foreground font-semibold">template rebuild</span> for{' '}
              <code className="font-mono text-xs text-foreground/90">{['`', '${NS}', '.key', '`'].join('')}</code> keys—without a whole-program TS AST.
            </p>
            <ul className="mt-3 space-y-1.5 text-[13px] list-none p-0 m-0">
              <li>
                <span className="text-foreground font-semibold">Template + runtime hole</span> —{' '}
                <code className="font-mono text-xs text-foreground/90">{['`${M}.statuses.${expr}`'].join('')}</code> with{' '}
                <code className="font-mono text-xs text-foreground/90">M</code> in const-map yields an uncertain prefix, not a proven leaf.
              </li>
              <li>
                <span className="text-foreground font-semibold">Commented-out calls</span> — every configured{' '}
                <code className="font-mono text-xs text-foreground/90">t()</code>-family call inside line or block
                comments is detected and reported. Those sites are never mutated—no{' '}
                <code className="font-mono text-xs text-foreground/90">validate</code>,{' '}
                <code className="font-mono text-xs text-foreground/90">missing</code>,{' '}
                <code className="font-mono text-xs text-foreground/90">sync</code>, or{' '}
                <code className="font-mono text-xs text-foreground/90">generate</code> writes touch commented
                lines; report-only visibility for dead code.
              </li>
            </ul>
          </div>
        </motion.div>

        <div ref={ref} className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          <div className="relative rounded-2xl glass-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card/70">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[11px] font-mono text-muted-foreground">Dashboard.tsx</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">TypeScript · UTF-8</span>
            </div>
            <div className="relative terminal-bg font-mono text-[13px] leading-[1.7] py-4">
              {scanning && (
                <motion.div
                  initial={{ top: 0, opacity: 0 }}
                  animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.4, ease: 'easeInOut' }}
                  className="scanline absolute inset-x-0 h-10 pointer-events-none"
                />
              )}
              {CODE_LINES.map((l) => (
                <div key={l.ln} className="flex">
                  <span className="select-none w-12 text-right pr-4 text-muted-foreground/50">{l.ln}</span>
                  <span className="flex-1 text-foreground/90">{l.content}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-border/50 bg-card/70 flex items-center justify-between text-[11px] font-mono gap-3">
              <span className="text-primary shrink-0">● Scan complete</span>
              <span className="text-muted-foreground text-right">
                4 sites · 2 literal · 1 dynamic · 1 commented · <span className="text-primary">0.8ms</span>
              </span>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm tracking-wide">Extracted Keys</h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                ns: dashboard
              </span>
            </div>
            <div className="font-mono text-[13px] space-y-1">
              <div className="text-muted-foreground">dashboard/</div>
              {KEYS.map((k, i) => {
                const tone = keyTypeTone(k.type);
                return (
                  <motion.div
                    key={k.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={revealed > i ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between pl-4 py-1.5 border-l border-border/50 ml-2"
                    data-testid={`key-entry-${k.key}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground/60 shrink-0">├─</span>
                      <span className={`truncate ${tone.text}`}>{k.label}</span>
                    </div>
                    <KeyTypeBadge type={k.type} />
                  </motion.div>
                );
              })}
              <div className="text-muted-foreground pl-4 mt-2">{lineSpan}</div>
            </div>

            <div className="mt-6 pt-5 border-t border-border/40">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <Stat n={2} label="Literal" tone="primary" />
                <Stat n={1} label="Dynamic" tone="amber" />
                <Stat n={1} label="Commented" tone="muted" />
                <Stat n={0.8} unit="ms" label="Scan time" tone="primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  n,
  label,
  tone,
  unit,
}: {
  n: number;
  label: string;
  tone: 'primary' | 'amber' | 'muted';
  unit?: string;
}) {
  const color =
    tone === 'primary' ? 'text-primary' : tone === 'amber' ? 'text-amber-400' : 'text-muted-foreground';
  const decimals = n % 1 !== 0 ? 1 : 0;
  return (
    <div>
      <div className={`font-display text-2xl font-bold ${color}`}>
        <CountUp to={n} duration={1100} decimals={decimals} suffix={unit ?? ''} />
      </div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}
