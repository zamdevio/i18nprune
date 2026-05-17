import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, AlertTriangle, Cpu } from 'lucide-react';
import CountUp from '../components/CountUp';

interface KeyEntry { key: string; label: string; type: 'literal' | 'dynamic'; line: number; }

const KEYS: KeyEntry[] = [
  { key: 'welcome_title', label: 'welcome_title', type: 'literal', line: 7 },
  { key: 'stats.active_users', label: 'stats.active_users', type: 'literal', line: 8 },
  { key: 'dynamic.${status}', label: 'dynamic.*', type: 'dynamic', line: 9 },
];

const CODE_LINES = [
  {
    ln: 1,
    content: (
      <>
        <span className="text-pink-400">import</span> {'{ '}
        <span className="text-sky-300">t</span> <span className="text-pink-400">as</span> <span className="text-sky-300">renameT</span>
        {' }'} <span className="text-pink-400">from</span> <span className="text-amber-300">'@/i18n'</span>;
      </>
    ),
  },
  {
    ln: 2,
    content: (
      <>
        <span className="text-pink-400">import</span> <span className="text-pink-400">*</span> <span className="text-pink-400">as</span>{' '}
        <span className="text-sky-300">i18n</span> <span className="text-pink-400">from</span> <span className="text-amber-300">'@/i18n'</span>;
      </>
    ),
  },
  { ln: 3, content: <></> },
  { ln: 4, content: <><span className="text-pink-400">export function</span> <span className="text-sky-300">Dashboard</span>() {'{'}</> },
  {
    ln: 5,
    content: (
      <>
        {'  '}
        <span className="text-pink-400">const</span> <span className="text-sky-300">status</span> = <span className="text-amber-300">&apos;live&apos;</span>;
      </>
    ),
  },
  { ln: 6, content: <>  <span className="text-pink-400">return</span> (</> },
  {
    ln: 7,
    content: (
      <>
        {'    '}
        {'<div>'}
        <span className="bg-primary/10 text-primary px-1 rounded-sm" data-key="welcome_title">
          {'{renameT('}
          <span className="text-amber-300">&apos;welcome_title&apos;</span>
          {')}'}</span>
        {'</div>'}
      </>
    ),
  },
  {
    ln: 8,
    content: (
      <>
        {'    '}
        {'<p>'}
        <span className="bg-primary/10 text-primary px-1 rounded-sm" data-key="stats.active_users">
          {'{i18n.t('}
          <span className="text-amber-300">&apos;stats.active_users&apos;</span>
          {')}'}</span>
        {'</p>'}
      </>
    ),
  },
  {
    ln: 9,
    content: (
      <>
        {'    '}
        {'<span>'}
        <span className="bg-amber-500/10 text-amber-300 px-1 rounded-sm" data-key="dynamic.${status}">
          {'{renameT('}
          <span className="text-amber-300">{'`dynamic.${status}`'}</span>
          {')}'}</span>
        {'</span>'}
      </>
    ),
  },
  { ln: 10, content: <>  );</> },
  { ln: 11, content: <>{'}'}</> },
];

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
          // build the tree as scan progresses
          KEYS.forEach((_, i) => {
            setTimeout(() => setRevealed(i + 1), 800 + i * 600);
          });
        }
      }),
      { threshold: 0.4 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="code-intelligence"
      className="relative py-28 border-t border-border/30"
      data-testid="code-intelligence-section"
    >
      <div className="mx-auto max-w-7xl px-6">
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
            Per-file key-site scanning resolves literal arguments on every effective translation helper—including renamed imports such as{' '}
            <code className="font-mono text-primary text-sm">t as renameT</code> and namespace patterns like{' '}
            <code className="font-mono text-primary text-sm">import * as i18n</code> followed by{' '}
            <code className="font-mono text-primary text-sm">i18n.t(...)</code>. An import binding pass expands the configured function list before call-site detection runs, so key extraction and dynamic classification consume the same richer symbol set as{' '}
            <code className="font-mono text-foreground/90 text-xs">validate</code> / <code className="font-mono text-foreground/90 text-xs">sync</code>. The pipeline is intentionally lightweight: staged text analysis rather than a full TypeScript program AST or type checker.
          </p>
          <div className="mt-8 rounded-xl border border-border/50 bg-card/25 backdrop-blur-md px-4 py-3 text-sm text-muted-foreground leading-relaxed">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/90">Extractor architecture</span>
            <p className="mt-2 text-[13px]">
              Three coordinated layers feed the scanner: an <span className="text-foreground font-semibold">import binding resolver</span> (ESM and CJS import shapes, including aliases and <code className="font-mono text-xs text-foreground/90">* as</code> namespaces with a configured{' '}
              <code className="font-mono text-xs text-foreground/90">.t</code> member), the shipped <span className="text-foreground font-semibold">const-map</span> for per-file string constants, and the <span className="text-foreground font-semibold">template rebuild</span> path for{' '}
              <code className="font-mono text-xs text-foreground/90">{['`', '${NS}', '.key', '`'].join('')}</code>-style keys. Together they keep key-site and dynamic pipelines aligned with real import patterns—without relying on a heavyweight TS AST walk or whole-program semantic analysis.
            </p>
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
              {/* scanline */}
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
            <div className="px-4 py-2.5 border-t border-border/50 bg-card/70 flex items-center justify-between text-[11px] font-mono">
              <span className="text-primary">● Scan complete</span>
              <span className="text-muted-foreground">3 keys · 2 literal · 1 dynamic · <span className="text-primary">0.8ms</span></span>
            </div>
          </div>

          {/* Key tree panel */}
          <div className="rounded-2xl glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm tracking-wide">Extracted Keys</h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                ns: dashboard
              </span>
            </div>
            <div className="font-mono text-[13px] space-y-1">
              <div className="text-muted-foreground">dashboard/</div>
              {KEYS.map((k, i) => (
                <motion.div
                  key={k.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={revealed > i ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between pl-4 py-1.5 border-l border-border/50 ml-2"
                  data-testid={`key-entry-${k.key}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/60">├─</span>
                    <span className={k.type === 'literal' ? 'text-foreground' : 'text-amber-300'}>
                      {k.label}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${
                    k.type === 'literal' ? 'text-primary' : 'text-amber-400'
                  }`}>
                    {k.type === 'literal' ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {k.type}
                  </span>
                </motion.div>
              ))}
              <div className="text-muted-foreground pl-4 mt-2">L{revealed > 0 ? '7' : '-'}–L{revealed >= KEYS.length ? '9' : '-'}</div>
            </div>

            <div className="mt-6 pt-5 border-t border-border/40">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat n={2} label="Literal" tone="primary" />
                <Stat n={1} label="Dynamic" tone="amber" />
                <Stat n={0.8} unit="ms" label="Scan time" tone="primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label, tone, unit }: { n: number; label: string; tone: 'primary' | 'amber'; unit?: string }) {
  const color = tone === 'primary' ? 'text-primary' : 'text-amber-400';
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
