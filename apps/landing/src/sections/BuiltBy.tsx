import { motion } from 'motion/react';
import { Github, Twitter, Layers, Boxes, Server, Code2, ShieldCheck, Sparkles, GitBranch } from 'lucide-react';
import { useMemo } from 'react';
import { linkHref } from '../lib/meta';
import { useMeta } from '../context/MetaContext';
import CountUp from '../components/CountUp';

function githubProfileUrl(repoUrl: string): string {
  try {
    const u = new URL(repoUrl);
    const seg = u.pathname.split('/').filter(Boolean);
    const owner = seg[0];
    if (owner) return `${u.origin}/${owner}`;
  } catch {
    /* ignore */
  }
  return repoUrl;
}

interface Stat { icon: React.ComponentType<{ className?: string }>; label: string; value: number; suffix?: string }
const STATS: Stat[] = [
  { icon: GitBranch, label: 'Weeks · solo',         value: 10 },
  { icon: Boxes,     label: 'SDK package',          value: 1 },
  { icon: Layers,    label: 'Surfaces shipped',     value: 5 },
  { icon: Server,    label: 'Runtime adapters',     value: 3 },
];

interface QA { q: string; a: React.ReactNode }
const QA: QA[] = [
  {
    q: 'Why a separate SDK instead of just a CLI?',
    a: (
      <>
        Because the same problem shows up in five places. A CLI for the local dev loop. An IDE extension for live drift. Browser apps for playground and report UIs. An edge worker for hosted validators. <code className="font-mono text-foreground bg-card/60 border border-border/50 rounded px-1 py-0.5 text-[12px]">@i18nprune/core</code> is the one engine; the five surfaces just bring it different food.
      </>
    ),
  },
  {
    q: 'How is it dev-friendly?',
    a: 'Strict folder discipline — every command lives in commands/<name>/{run, hooks, jsonEnvelope, index}.ts with no shortcuts. Runtime-neutral core means no Node-only imports leak into the Web or Edge bundles. JSON envelopes are stable contracts, not pretty-print summaries dressed up as data. Tests are local to the module they cover. New contributors find what they expect.',
  },
  {
    q: "What's the long-term play?",
    a: 'Built for ten years, not ten thousand stars. Same algorithms on every host, structured outputs everywhere, opt-in mutation, semantic exit codes, env vars that mirror flags. Every API surface is typed; every command emits a stable envelope. The boring parts are the moat — when the team grows, nothing about this codebase will need to be re-learned.',
  },
  {
    q: 'Why a 19-year-old solo developer?',
    a: 'No legacy to defend, no committee to convince. Ten weeks of constraint and one obsession. The trade-off is fewer hands — so every line of code earned its place. If you find an opinion you disagree with, file an issue; the design is opinionated but not closed.',
  },
];

interface Principle { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }
const PRINCIPLES: Principle[] = [
  { icon: Boxes,       title: 'Separation',  desc: 'CLI ≠ SDK ≠ runtime adapter. Three boundaries enforced by code review and lint.' },
  { icon: Code2,       title: 'Discipline',  desc: 'Same folder shape across every command. No bespoke wiring, no special cases.' },
  { icon: ShieldCheck, title: 'Long-term',   desc: 'Stable JSON envelopes, semver exit codes, env vars mirror flags. APIs designed once.' },
  { icon: Sparkles,    title: 'Consistency', desc: 'One config schema, one logger, one envelope shape. Every command obeys it.' },
];

export default function BuiltBy() {
  const { links } = useMeta();
  const profileUrl = useMemo(
    () => githubProfileUrl(linkHref(links, 'githubRepo')),
    [links],
  );
  const twitterUrl = linkHref(links, 'twitter');

  return (
    <section
      id="built-by"
      className="section"
      data-testid="builtby-section"
    >
      <div className="section-inner-narrow">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md mb-4">
            <span className="font-display font-bold text-primary text-base">zd</span>
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-primary/80 mb-3">
            Author
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-[1.05]">
            Built by{' '}
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="stat-highlight hover:opacity-90 transition-opacity"
              data-testid="builtby-author"
            >
              zamdevio
            </a>
            {' · '}solo · 19.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed text-balance">
            Solo-built in 10 weeks from real frustration — 1,200 translation keys across 5 languages in a production app. Then rebuilt as an SDK so the same engine could ship five ways.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              data-testid="builtby-github"
              className="w-9 h-9 rounded-full border border-border/40 bg-card/30 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter profile"
              data-testid="builtby-twitter"
              className="w-9 h-9 rounded-full border border-border/40 bg-card/30 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        {/* Solo stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3"
          data-testid="solo-stats"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.06 * i }}
              className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-4 text-center"
            >
              <s.icon className="w-4 h-4 text-primary mx-auto mb-2" />
              <div className="font-display text-3xl font-bold text-foreground">
                <CountUp to={s.value} duration={1200} testId={`solo-stat-${s.label.toLowerCase().replace(/[^a-z]/g, '-')}`} />
                {s.suffix ?? ''}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12"
        >
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-primary/80 text-center mb-5">
            Why the codebase will still make sense in 5 years
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-md p-4"
                data-testid={`principle-${p.title.toLowerCase()}`}
              >
                <p.icon className="w-4 h-4 text-primary mb-3" />
                <h3 className="font-display font-semibold text-sm">{p.title}</h3>
                <p className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Q&A */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14"
        >
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-primary/80 text-center mb-6">
            Built solo because…
          </div>
          <div className="rounded-2xl glass-panel divide-y divide-border/40 overflow-hidden">
            {QA.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.04 * i }}
                className="p-5 sm:p-6"
                data-testid={`qa-${i}`}
              >
                <h3 className="font-display font-semibold text-base sm:text-lg tracking-tight">
                  <span className="text-primary font-mono text-xs mr-2">Q{i + 1}</span>
                  {item.q}
                </h3>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed text-balance">
                  {item.a}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
