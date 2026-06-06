import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMobileLayout } from '../../hooks/useMediaQuery';
import type { WeeklyCommitItem } from '../../types';
import { PHASE_COLORS } from '../../types';
import styles from './bar-chart.module.css';

interface CommitBarChartProps {
  data: WeeklyCommitItem[];
}

interface TooltipPayload {
  payload: WeeklyCommitItem;
}

function WeeklyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>
        {item.label} — {item.count} commits
      </p>
      <p className={styles.tooltipTheme}>{item.theme}</p>
    </div>
  );
}

export function CommitBarChart({ data }: CommitBarChartProps) {
  const isMobile = useMobileLayout();

  return (
    <div className={styles.chartWrap}>
      <h3 className={styles.title}>Weekly commit volume</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <Tooltip content={<WeeklyTooltip />} cursor={{ fill: 'var(--color-table-hover)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.week} fill={PHASE_COLORS[entry.color]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
