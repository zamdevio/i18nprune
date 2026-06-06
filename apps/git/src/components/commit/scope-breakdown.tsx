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
import type { ScopeBreakdownItem } from '../../types';
import { PHASE_COLORS } from '../../types';
import { BreakdownTooltip } from './breakdown-tooltip';
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
  const isMobile = useMobileLayout();

  return (
    <div className={styles.chartWrap}>
      <h3 className={styles.title}>By scope</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 320 : 280}>
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
            width={isMobile ? 108 : 96}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <Tooltip
            content={<BreakdownTooltip nameKey="scope" />}
            cursor={{ fill: 'var(--color-table-hover)' }}
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
