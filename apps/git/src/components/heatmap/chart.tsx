import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleDayClick = (day: DayHeatmapItem): void => {
    if (day.count === 0) return;
    navigate(`/commits?q=${encodeURIComponent(day.date)}`);
  };

  return (
    <div className={styles.heatmap}>
      <h3 className={styles.title}>Daily commit density</h3>
      <p className={styles.dateRange}>
        {firstDate} — {lastDate}
      </p>
      <div className={styles.grid}>
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`${styles.cell} ${heatLevel(day.count)} ${day.count > 0 ? styles.clickable : ''}`}
            title={`${day.date}: ${day.count} commit${day.count === 1 ? '' : 's'}`}
            aria-label={`${day.date}: ${day.count} commits`}
            disabled={day.count === 0}
            onClick={() => handleDayClick(day)}
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
