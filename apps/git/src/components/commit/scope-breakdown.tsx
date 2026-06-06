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
import type { ScopeBreakdownItem } from '../../types';
import { PHASE_COLORS } from '../../types';
import styles from './scope-breakdown.module.css';

interface ScopeBreakdownProps {
  data: ScopeBreakdownItem[];
}

const SCOPE_COLORS = [
  PHASE_COLORS.teal,
  PHASE_COLORS.teal,
  PHASE_COLORS.gray,
  PHASE_COLORS.purple,
  PHASE_COLORS.purple,
  PHASE_COLORS.coral,
  PHASE_COLORS.coral,
];

export function ScopeBreakdown({ data }: ScopeBreakdownProps) {
  return (
    <div className={styles.chartWrap}>
      <h3 className={styles.title}>By scope</h3>
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
            dataKey="scope"
            width={96}
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
            {data.map((entry, index) => (
              <Cell key={entry.scope} fill={SCOPE_COLORS[index % SCOPE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
