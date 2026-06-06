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
import type { TypeBreakdownItem } from '../../types';
import { TYPE_COLORS } from '../../types';
import styles from './type-breakdown.module.css';

interface TypeBreakdownProps {
  data: TypeBreakdownItem[];
}

function typeColor(type: TypeBreakdownItem['type']): string {
  if (type === 'ci/build') return TYPE_COLORS.ci;
  return TYPE_COLORS[type];
}

export function TypeBreakdown({ data }: TypeBreakdownProps) {
  return (
    <div className={styles.chartWrap}>
      <h3 className={styles.title}>By type</h3>
      <ResponsiveContainer width="100%" height={280}>
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
            formatter={(value: number) => [`${value} commits`, 'Count']}
            contentStyle={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: 12,
            }}
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
