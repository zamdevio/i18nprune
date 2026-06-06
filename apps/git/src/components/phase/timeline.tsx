import type { Phase } from '../../types';
import { PhaseCard } from './card';
import styles from './timeline.module.css';

interface TimelineProps {
  phases: Phase[];
}

export function Timeline({ phases }: TimelineProps) {
  const maxCommits = Math.max(...phases.map((p) => p.commits), 1);

  return (
    <div className={styles.timeline}>
      {phases.map((phase) => (
        <PhaseCard key={phase.week} phase={phase} maxCommits={maxCommits} />
      ))}
    </div>
  );
}
