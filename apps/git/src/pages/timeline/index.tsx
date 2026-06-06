import { Heatmap, Timeline } from '../../components';
import type { Commit, DayHeatmapItem, Phase, Summary } from '../../types';
import styles from './index.module.css';

interface TimelinePageProps {
  phases: Phase[];
  commits: Commit[];
  summary: Summary;
}

function buildDayRange(first: string, last: string, commits: Commit[]): DayHeatmapItem[] {
  const counts = new Map<string, number>();
  const start = new Date(`${first}T12:00:00Z`);
  const end = new Date(`${last}T12:00:00Z`);
  const days: DayHeatmapItem[] = [];

  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const date = new Date(t).toISOString().slice(0, 10);
    days.push({ date, count: 0 });
    counts.set(date, 0);
  }

  for (const commit of commits) {
    if (counts.has(commit.date)) {
      counts.set(commit.date, (counts.get(commit.date) ?? 0) + 1);
    }
  }

  return days.map((day) => ({ ...day, count: counts.get(day.date) ?? 0 }));
}

export function TimelinePage({ phases, commits, summary }: TimelinePageProps) {
  const heatmapDays = buildDayRange(summary.firstCommit, summary.lastCommit, commits);

  return (
    <div>
      <h1 className="pageTitle">Timeline</h1>

      <section className={`pageSection ${styles.section}`}>
        <Timeline phases={phases} />
      </section>

      <section className="pageSection">
        <Heatmap
          days={heatmapDays}
          firstDate={summary.firstCommit}
          lastDate={summary.lastCommit}
        />
      </section>
    </div>
  );
}
