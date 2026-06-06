import { Link } from 'react-router-dom';
import {
  CommitBarChart,
  CommitList,
  MetricCard,
  ScopeBreakdown,
  TypeBreakdown,
} from '../../components';
import { SyncStatus } from '../../components/layout/sync-status';
import { branchProfilePath } from '../../lib/branches';
import { computeScopeBreakdown, computeTypeBreakdown } from '../../lib/breakdown';
import { formatNumber, formatPeakDay } from '../../lib/format';
import { tagProfilePath } from '../../lib/tags';
import type { Commit, GitBranch, GitTag, Phase, Summary } from '../../types';
import styles from './index.module.css';

interface OverviewProps {
  summary: Summary;
  phases: Phase[];
  commits: Commit[];
  tags: GitTag[];
  branches: GitBranch[];
}

const RECENT_COMMITS = 8;

function weekShortLabel(week: string): string {
  const match = week.match(/W(\d+)/);
  return match ? `W${match[1]}` : week;
}

function latestTag(tags: GitTag[]): GitTag | undefined {
  return tags.reduce<GitTag | undefined>((best, tag) => {
    if (!best) return tag;
    return tag.date >= best.date ? tag : best;
  }, undefined);
}

function currentBranch(branches: GitBranch[]): GitBranch | undefined {
  return branches.find((branch) => branch.isCurrent) ?? branches[0];
}

export function Overview({ summary, phases, commits, tags, branches }: OverviewProps) {
  const weeklyData = phases.map((phase) => ({
    week: phase.week,
    label: weekShortLabel(phase.week),
    count: phase.commits,
    color: phase.color,
    theme: phase.theme,
  }));

  const typeBreakdown = computeTypeBreakdown(commits);
  const scopeBreakdown = computeScopeBreakdown(commits);
  const recentCommits = commits.slice(0, RECENT_COMMITS);
  const release = latestTag(tags);
  const branch = currentBranch(branches);
  const releaseUrl =
    summary.githubRepoUrl && release ?
      `${summary.githubRepoUrl}/releases/tag/${encodeURIComponent(release.name)}`
    : null;

  return (
    <div>
      <h1 className="pageTitle">Overview</h1>

      <SyncStatus syncedAt={summary.syncedAt} variant="banner" />

      <div className={styles.metricGrid}>
        <MetricCard value={String(summary.totalCommits)} label="Total commits" to="/commits" />
        <MetricCard
          value={String(summary.authors)}
          label={summary.authors === 1 ? 'Engineer (solo)' : 'Engineers'}
          to="/authors"
        />
        <MetricCard
          value={`${summary.activeDays} / ${summary.calendarDays}`}
          label="Active days / calendar"
        />
        <MetricCard value={String(summary.tags.length)} label="Git tags" to="/tags" />
        <MetricCard
          value={`${formatPeakDay(summary.topCommitDay.date)} — ${summary.topCommitDay.count}`}
          label="Peak day commits"
        />
        <MetricCard value={String(summary.branches.length)} label="Branches" to="/branches" />
      </div>

      <div className={`${styles.metricGrid} ${styles.metricGridSecondary}`}>
        <MetricCard value={formatNumber(summary.tsFiles)} label="TypeScript files" />
        <MetricCard value={formatNumber(summary.tsSourceLines)} label="TS source lines" />
        <MetricCard value={formatNumber(summary.mdLines)} label="Markdown lines" />
        <MetricCard
          value={`+${formatNumber(summary.netLinesAdded)}`}
          label="Net lines added"
          tone="add"
        />
        <div className={styles.metricFull}>
          <MetricCard
            value={`${summary.firstCommit} → ${summary.lastCommit}`}
            label="Commit range"
          />
        </div>
      </div>

      {release || branch ?
        <section className={styles.releaseStrip}>
          {release ?
            <Link to={tagProfilePath(release.name)} className={styles.releaseCard}>
              <span className={styles.releaseLabel}>Latest release</span>
              <span className={styles.releaseValue}>{release.name}</span>
              <span className={styles.releaseMeta}>
                {release.date} · {release.shortHash}
              </span>
              <span className={styles.releaseSubject}>{release.subject}</span>
            </Link>
          : null}
          {branch ?
            <Link to={branchProfilePath(branch.name)} className={styles.releaseCard}>
              <span className={styles.releaseLabel}>
                {branch.isCurrent ? 'Current branch' : 'Branch tip'}
              </span>
              <span className={styles.releaseValue}>{branch.name}</span>
              <span className={styles.releaseMeta}>
                {branch.date} · {branch.shortHash}
              </span>
              <span className={styles.releaseSubject}>{branch.subject}</span>
            </Link>
          : null}
          {releaseUrl ?
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.releaseExternal}
            >
              View release on GitHub →
            </a>
          : null}
        </section>
      : null}

      <section className="pageSection">
        <CommitBarChart data={weeklyData} />
      </section>

      <section className={`pageSection ${styles.chartRow}`}>
        <TypeBreakdown data={typeBreakdown} />
        <ScopeBreakdown data={scopeBreakdown} />
      </section>

      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent commits</h2>
        <CommitList
          commits={recentCommits}
          emptyMessage="No commits synced yet."
          footer={
            commits.length > RECENT_COMMITS ?
              <p className={styles.more}>
                Showing latest {RECENT_COMMITS} of {commits.length} commits.{' '}
                <Link to="/commits" className={styles.moreLink}>
                  View full log
                </Link>
              </p>
            : commits.length > 0 ?
              <p className={styles.moreMuted}>Showing all {commits.length} commits.</p>
            : undefined
          }
        />
      </section>
    </div>
  );
}
