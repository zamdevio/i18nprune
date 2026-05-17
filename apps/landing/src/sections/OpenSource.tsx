import { motion } from 'motion/react';
import { Github, Heart, Star, GitFork, Users, AlertCircle } from 'lucide-react';
import { useGitHub } from '../hooks/useGitHub';
import { formatCount } from '../lib/github';
import { linkHref } from '../lib/meta';
import { useMeta } from '../context/MetaContext';
import CountUp from '../components/CountUp';

function StatSkeleton() {
  return (
    <span
      className="inline-block w-12 h-7 align-middle rounded bg-muted/40 animate-pulse"
      aria-hidden="true"
      data-testid="stat-skeleton"
    />
  );
}

interface StatEntry {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null | undefined;
}

export default function OpenSource() {
  const gh = useGitHub();
  const { links } = useMeta();

  const stats: StatEntry[] = [
    { key: 'stars', icon: Star, label: 'Stars', value: gh?.stars },
    { key: 'forks', icon: GitFork, label: 'Forks', value: gh?.forks },
    { key: 'contributors', icon: Users, label: 'Contributors', value: gh?.contributors },
    { key: 'issues', icon: AlertCircle, label: 'Issues', value: gh?.openIssues },
  ];

  return (
    <section
      id="open-source"
      className="relative py-28 border-t border-border/30"
      data-testid="opensource-section"
    >
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl glass-panel p-8 sm:p-12 text-center overflow-hidden"
        >
          <div className="absolute inset-0 hero-glow opacity-40 pointer-events-none" aria-hidden="true" />
          <div className="relative">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">
              Open source
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Built{' '}
              <span className="stat-highlight">in the open.</span>
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground leading-relaxed">
              MIT licensed, community-driven. Read the source, file an issue, send a PR — every contribution shapes the toolkit.
            </p>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="github-stats">
              {stats.map((s) => {
                const hasValue = s.value != null && Number.isFinite(s.value);
                const small = hasValue && (s.value as number) < 1000;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-md p-4"
                    data-testid={`stat-${s.label.toLowerCase()}`}
                  >
                    <s.icon className="w-4 h-4 text-primary mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold tabular-nums">
                      {!hasValue ? (
                        <StatSkeleton />
                      ) : small ? (
                        <CountUp to={s.value as number} duration={1200} />
                      ) : (
                        formatCount(s.value as number)
                      )}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                      {s.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={linkHref(links, 'githubRepo')}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="star-github-btn"
                className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-full bg-foreground text-background font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <Github className="w-4 h-4" />
                Star on GitHub
              </a>
              <span className="inline-flex items-center gap-1.5 px-3 h-11 rounded-full border border-border/50 bg-card/40 text-xs font-mono text-muted-foreground">
                <Heart className="w-3.5 h-3.5 text-primary" /> MIT Licensed
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
