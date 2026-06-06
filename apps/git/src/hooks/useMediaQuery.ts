import { useEffect, useState } from 'react';

export const MOBILE_QUERY = '(max-width: 767px)';
export const TABLET_QUERY = '(max-width: 1023px)';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (): void => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useCompactLayout(): boolean {
  return useMediaQuery(TABLET_QUERY);
}

export function useMobileLayout(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
