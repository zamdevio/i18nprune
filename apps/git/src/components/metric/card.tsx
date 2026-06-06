import { Link } from 'react-router-dom';
import styles from './card.module.css';

interface MetricCardProps {
  value: string;
  label: string;
  to?: string;
  /** Colors the value only — label stays muted */
  tone?: 'add' | 'del';
}

function valueClassName(tone: MetricCardProps['tone']): string {
  if (tone === 'add') return `${styles.value} ${styles.valueAdd}`;
  if (tone === 'del') return `${styles.value} ${styles.valueDel}`;
  return styles.value;
}

export function MetricCard({ value, label, to, tone }: MetricCardProps) {
  const card = (
    <div className={styles.card}>
      <p className={valueClassName(tone)}>{value}</p>
      <p className={styles.label}>{label}</p>
    </div>
  );

  if (!to) return card;

  return (
    <Link to={to} className={styles.link}>
      {card}
    </Link>
  );
}
