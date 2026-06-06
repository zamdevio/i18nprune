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
import type { TypeBreakdownItem } from '../../types';
import { TYPE_COLORS } from '../../types';
import { BreakdownTooltip } from './breakdown-tooltip';
import styles from './type-breakdown.module.css';

interface TypeBreakdownProps {
  data: TypeBreakdownItem[];
}

function typeColor(type: TypeBreakdownItem['type']): string {
  if (type === 'ci/build') return TYPE_COLORS.ci;
  return TYPE_COLORS[type];
}

export function TypeBreakdown({ data }: TypeBreakdownProps) {
  const isMobile = useMobileLayout();

  return (
    <div className={styles.chartWrap}>
      <h3 className={styles.title}>By type</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="type"
            width={72}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <Tooltip
            content={<BreakdownTooltip nameKey="type" />}
            cursor={{ fill: 'var(--color-table-hover)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.type} fill={typeColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
