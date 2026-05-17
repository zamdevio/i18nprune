import { useCountUp } from '../hooks/useCountUp';

interface Props {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  testId?: string;
}

export default function CountUp({
  to, duration, decimals, prefix = '', suffix = '', className, testId,
}: Props) {
  const { ref, display } = useCountUp({ to, duration, decimals });
  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={`tabular-nums ${className ?? ''}`}
      data-testid={testId}
    >
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
