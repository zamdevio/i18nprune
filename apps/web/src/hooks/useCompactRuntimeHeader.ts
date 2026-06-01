import { useEffect, useState } from 'react';

/** Sidebar header mode for web runtime (width &lt; 730px). */
export const WEB_COMPACT_HEADER_MQ = '(max-width: 729px)';

export function useCompactRuntimeHeader(): boolean {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(WEB_COMPACT_HEADER_MQ).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(WEB_COMPACT_HEADER_MQ);
    const onChange = (): void => setCompact(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}
