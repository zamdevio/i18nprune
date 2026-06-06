import type { CSSProperties } from 'react';
import type { Phase } from '../../types';
import { PHASE_COLORS } from '../../types';
import styles from './card.module.css';

interface PhaseCardProps {
  phase: Phase;
  maxCommits: number;
}

export function PhaseCard({ phase, maxCommits }: PhaseCardProps) {
  const accent = PHASE_COLORS[phase.color];
  const barHeight = Math.max(24, Math.round((phase.commits / maxCommits) * 120));

  return (
    <article className={styles.card} style={{ '--accent': accent } as CSSProperties}>
      <div className={styles.density}>
        <div className={styles.densityBar} style={{ height: `${barHeight}px` }} />
        <span className={styles.densityLabel}>{phase.commits}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.label}>{phase.label}</h3>
          <span className={styles.badge}>{phase.commits} commits</span>
        </div>
        <p className={styles.theme}>{phase.theme}</p>
        <div className={styles.chips}>
          {phase.shipped.map((item) => (
            <span key={item} className={styles.chip}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
