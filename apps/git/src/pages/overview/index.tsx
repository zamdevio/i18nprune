import {
  CommitBarChart,
  MetricCard,
  ScopeBreakdown,
  TypeBreakdown,
} from '../../components';
import { computeScopeBreakdown, computeTypeBreakdown } from '../../lib/breakdown';
import type { Commit, Phase, Summary } from '../../types';
import styles from './index.module.css';

interface OverviewProps {
  summary: Summary;
  phases: Phase[];
  commits: Commit[];
}

function formatPeakDay(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function weekShortLabel(week: string): string {
  const match = week.match(/W(\d+)/);
  return match ? `W${match[1]}` : week;
}

export function Overview({ summary, phases, commits }: OverviewProps) {
  const weeklyData = phases.map((phase) => ({
    week: phase.week,
    label: weekShortLabel(phase.week),
    count: phase.commits,
    color: phase.color,
    theme: phase.theme,
  }));

  const typeBreakdown = computeTypeBreakdown(commits);
  const scopeBreakdown = computeScopeBreakdown(commits);

  return (
    <div>
      <h1 className="pageTitle">Overview</h1>

      <div className={styles.metricGrid}>
        <MetricCard value={String(summary.totalCommits)} label="Total commits" />
        <MetricCard
          value={`${summary.activeDays} / ${summary.calendarDays}`}
          label="Active days / calendar"
        />
        <MetricCard
          value={String(summary.authors)}
          label={summary.authors === 1 ? 'Engineer (solo)' : 'Engineers'}
        />
        <MetricCard
          value={`${formatPeakDay(summary.topCommitDay.date)} — ${summary.topCommitDay.count}`}
          label="Peak day commits"
        />
      </div>

      <section className="pageSection">
        <CommitBarChart data={weeklyData} />
      </section>

      <section className={`pageSection ${styles.chartRow}`}>
        <TypeBreakdown data={typeBreakdown} />
        <ScopeBreakdown data={scopeBreakdown} />
      </section>
    </div>
  );
}
