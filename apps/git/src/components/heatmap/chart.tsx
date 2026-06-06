import type { DayHeatmapItem } from '../../types';
import styles from './chart.module.css';

interface HeatmapProps {
  days: DayHeatmapItem[];
  firstDate: string;
  lastDate: string;
}

function heatLevel(count: number): string {
  if (count === 0) return styles.level0;
  if (count <= 5) return styles.level1;
  if (count <= 15) return styles.level2;
  return styles.level4;
}

export function Heatmap({ days, firstDate, lastDate }: HeatmapProps) {
  return (
    <div className={styles.heatmap}>
      <h3 className={styles.title}>Daily commit density</h3>
      <p className={styles.dateRange}>
        {firstDate} — {lastDate}
      </p>
      <div className={styles.grid}>
        {days.map((day) => (
          <div
            key={day.date}
            className={`${styles.cell} ${heatLevel(day.count)}`}
            title={`${day.date}: ${day.count} commit${day.count === 1 ? '' : 's'}`}
          />
        ))}
      </div>
      <div className={styles.legend}>
        <span>Less</span>
        <div className={styles.legendCells}>
          <div className={`${styles.legendCell} ${styles.level0}`} />
          <div className={`${styles.legendCell} ${styles.level1}`} />
          <div className={`${styles.legendCell} ${styles.level2}`} />
          <div className={`${styles.legendCell} ${styles.level3}`} />
          <div className={`${styles.legendCell} ${styles.level4}`} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
