import styles from './breakdown-tooltip.module.css';

interface BreakdownTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: { type?: string; scope?: string; count?: number } }>;
  label?: string;
  nameKey: 'type' | 'scope';
}

export function BreakdownTooltip({
  active,
  payload,
  label,
  nameKey,
}: BreakdownTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  const name = (nameKey === 'type' ? item?.type : item?.scope) ?? label ?? '';
  const count = item?.count ?? 0;

  return (
    <div className={styles.tooltip}>
      <p className={styles.label}>{name}</p>
      <p className={styles.count}>
        {count} commit{count === 1 ? '' : 's'}
      </p>
    </div>
  );
}
