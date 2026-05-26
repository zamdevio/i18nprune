import { useEffect, useState } from 'react';

const COMPACT_MQ = '(max-width: 1023px)';

export function useCompactReportHeader(): boolean {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(COMPACT_MQ).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_MQ);
    const onChange = (): void => setCompact(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}
