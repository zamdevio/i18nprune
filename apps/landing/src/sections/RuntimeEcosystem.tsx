import { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Globe, Cloud, Code2, Server, ExternalLink, BarChart3, type LucideIcon } from 'lucide-react';

type RuntimeId = 'node' | 'web' | 'edge';

interface Surface {
  id: string;
  label: string;
  sub: string;
  url?: string;
  runtime: RuntimeId;
  tier: 'A' | 'B';
  icon: LucideIcon;
  /** clockwise angle in degrees, 0 = top */
  angle: number;
  comingSoon?: boolean;
}

interface RuntimeMeta {
  id: RuntimeId;
  label: string;
  importPath: string;
  tier: string;
  icon: LucideIcon;
  accent: string;
  ring: string;
  radius: number;
}

const RUNTIMES: RuntimeMeta[] = [
  {
    id: 'node',
    label: 'Node runtime',
    importPath: '@i18nprune/core/runtime/node',
    tier: 'Tier B · read + write',
    icon: Server,
    accent: 'text-sky-300',
    ring: 'border-sky-500/40 bg-sky-500/5',
    radius: 170,
  },
  {
    id: 'web',
    label: 'Web runtime',
    importPath: '@i18nprune/core/runtime/web',
    tier: 'Tier A · read / analyze',
    icon: Globe,
    accent: 'text-primary',
    ring: 'border-primary/40 bg-primary/5',
    radius: 240,
  },
  {
    id: 'edge',
    label: 'Edge runtime',
    importPath: '@i18nprune/core/runtime/edge',
    tier: 'Tier A · read / analyze',
    icon: Cloud,
    accent: 'text-amber-300',
    ring: 'border-amber-500/40 bg-amber-500/5',
    radius: 310,
  },
];

const SURFACES: Surface[] = [
  // Node ring (top half)
  { id: 'cli', label: 'CLI', sub: 'i18nprune', runtime: 'node', tier: 'B', icon: Terminal, angle: 320 },
  { id: 'ide', label: 'IDE extension', sub: 'coming soon', runtime: 'node', tier: 'B', icon: Code2, angle: 40, comingSoon: true },

  // Web ring (right side) — web + report twins
  { id: 'web', label: 'web.i18nprune.dev', sub: 'playground · explorer', url: 'https://web.i18nprune.dev', runtime: 'web', tier: 'A', icon: Globe, angle: 90 },
  { id: 'report', label: 'report.i18nprune.dev', sub: 'report UI · share links', url: 'https://report.i18nprune.dev', runtime: 'web', tier: 'A', icon: BarChart3, angle: 130 },

  // Edge ring (bottom)
  { id: 'worker', label: 'worker.i18nprune.dev', sub: 'edge validators', url: 'https://worker.i18nprune.dev/docs', runtime: 'edge', tier: 'A', icon: Cloud, angle: 220 },
];

function polar(angle: number, radius: number, cx = 400, cy = 400) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RuntimeEcosystem() {
  const [hover, setHover] = useState<string | null>(null);
  const hoveredSurface = SURFACES.find((s) => s.id === hover) ?? null;

  return (
    <section
      id="runtime"
      className="section overflow-hidden"
      data-testid="runtime-section"
    >
      <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />
      <div className="section-inner relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mb-12"
        >
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">
            Runtime ecosystem
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            One SDK.{' '}
            <span className="stat-highlight">Every runtime.</span>
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed text-balance">
            <code className="font-mono text-foreground bg-card/60 border border-border/50 rounded px-1.5 py-0.5 text-sm">@i18nprune/core</code> is the SDK — one engine powering four live surfaces (CLI, web, report, worker) with an IDE extension on the way. Same algorithms, different bundles. Filesystem, networking, and bundle hygiene shift per host; behavior never does.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-center">
          {/* Constellation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center"
          >
            <svg viewBox="0 0 800 800" className="mx-auto w-full max-w-[min(100%,420px)] sm:max-w-[520px] lg:max-w-[680px] aspect-square">
              <defs>
                <radialGradient id="hub-glow-rt" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Hub glow */}
              <circle cx="400" cy="400" r="200" fill="url(#hub-glow-rt)" />

              {/* Rings + labels */}
              {RUNTIMES.map((rt, i) => (
                <g key={rt.id}>
                  <motion.circle
                    cx="400"
                    cy="400"
                    r={rt.radius}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="3 6"
                    initial={{ opacity: 0, pathLength: 0 }}
                    whileInView={{ opacity: 0.5, pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.15, ease: 'easeInOut' }}
                  />
                  <motion.text
                    x="400"
                    y={400 - rt.radius - 8}
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="10"
                    letterSpacing="2"
                    fill="hsl(var(--muted-foreground))"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
                  >
                    {rt.id.toUpperCase()}
                  </motion.text>
                </g>
              ))}

              {/* Connection lines hub → each surface */}
              {SURFACES.map((s) => {
                const rt = RUNTIMES.find((r) => r.id === s.runtime)!;
                const p = polar(s.angle, rt.radius);
                const isActive = hover === s.id;
                return (
                  <motion.line
                    key={`line-${s.id}`}
                    x1="400"
                    y1="400"
                    x2={p.x}
                    y2={p.y}
                    stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                    strokeOpacity={isActive ? 0.95 : 0.4}
                    strokeWidth={isActive ? 1.5 : 1}
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
                  />
                );
              })}

              {/* Central hub */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <circle cx="400" cy="400" r="68" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                <circle cx="400" cy="400" r="68" fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="1">
                  <animate attributeName="r" values="68;88;68" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
                <foreignObject x="332" y="332" width="136" height="136">
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <img src="/i18nprune.svg" alt="" className="w-11 h-11 mb-2 rounded-lg" aria-hidden="true" />
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">@core</div>
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">runtime-neutral</div>
                  </div>
                </foreignObject>
              </motion.g>

              {/* Surface nodes - uniform sized rounded cards */}
              {SURFACES.map((s, i) => {
                const rt = RUNTIMES.find((r) => r.id === s.runtime)!;
                const p = polar(s.angle, rt.radius);
                const W = 168;
                const H = 64;
                const isActive = hover === s.id;
                return (
                  <motion.g
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.9 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    onMouseEnter={() => setHover(s.id)}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: s.url && !s.comingSoon ? 'pointer' : 'default' }}
                    onClick={() => s.url && !s.comingSoon && window.open(s.url, '_blank', 'noopener,noreferrer')}
                    data-testid={`surface-${s.id}`}
                  >
                    {/* SVG-native rounded rect — perfect corners, no clipping issues */}
                    <rect
                      x={p.x - W / 2}
                      y={p.y - H / 2}
                      width={W}
                      height={H}
                      rx={14}
                      ry={14}
                      fill={isActive ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--secondary))'}
                      stroke={isActive ? 'hsl(var(--primary))' : s.comingSoon ? 'hsl(var(--muted-foreground) / 0.35)' : 'hsl(var(--muted-foreground) / 0.3)'}
                      strokeWidth={isActive ? 1.5 : 1}
                      strokeDasharray={s.comingSoon ? '4 4' : undefined}
                      style={{ transition: 'all 0.25s ease' }}
                    />
                    {isActive && (
                      <rect
                        x={p.x - W / 2 - 4}
                        y={p.y - H / 2 - 4}
                        width={W + 8}
                        height={H + 8}
                        rx={18}
                        ry={18}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeOpacity={0.3}
                        strokeWidth={1}
                      />
                    )}
                    <foreignObject x={p.x - W / 2 + 12} y={p.y - H / 2 + 10} width={W - 24} height={H - 20}>
                      <div className="w-full h-full flex items-center gap-2.5">
                        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-background/80 border border-border ${rt.accent}`}>
                          <s.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold leading-tight text-foreground truncate flex items-center gap-1">
                            {s.label}
                            {s.comingSoon && (
                              <span className="shrink-0 text-[8px] font-mono uppercase tracking-wide px-1 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                                soon
                              </span>
                            )}
                            {s.url && !s.comingSoon && <ExternalLink className="w-2.5 h-2.5 text-muted-foreground shrink-0" />}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground truncate">{s.sub}</div>
                        </div>
                      </div>
                    </foreignObject>
                  </motion.g>
                );
              })}
            </svg>
          </motion.div>

          {/* Side legend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
            data-testid="runtime-legend"
          >
            {RUNTIMES.map((rt) => {
              const count = SURFACES.filter((s) => s.runtime === rt.id).length;
              const Icon = rt.icon;
              const isActive = hoveredSurface?.runtime === rt.id;
              return (
                <div
                  key={rt.id}
                  className={`rounded-xl border p-4 transition-all duration-300 ${
                    isActive ? rt.ring + ' -translate-y-0.5' : 'border-border/50 bg-card/30'
                  }`}
                  data-testid={`runtime-${rt.id}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg bg-background/60 border border-border/50 flex items-center justify-center ${rt.accent}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-tight">{rt.label}</div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate">{rt.tier}</div>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">×{count}</span>
                  </div>
                  <code className={`block text-[10px] font-mono px-2 py-1 rounded bg-background/60 border border-border/50 truncate ${rt.accent}`}>
                    {rt.importPath}
                  </code>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {SURFACES.filter((s) => s.runtime === rt.id).map((s) => (
                      <span
                        key={s.id}
                        onMouseEnter={() => setHover(s.id)}
                        onMouseLeave={() => setHover(null)}
                        className={`cursor-pointer px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors ${
                          hover === s.id
                            ? 'border-primary/50 text-primary bg-primary/10'
                            : 'border-border/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            <p className="text-[11px] font-mono text-muted-foreground/80 pt-2 leading-relaxed">
              Tier <span className="text-primary">A</span> = analyze · Tier <span className="text-primary">B</span> = analyze + write. Same engine, different adapters.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
