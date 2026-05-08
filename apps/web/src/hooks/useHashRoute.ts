import { useCallback, useEffect, useState } from 'react';

function normalizeHash(): string {
  const raw = typeof window !== 'undefined' ? window.location.hash : '';
  if (!raw || raw === '#') return '/';
  const path = raw.startsWith('#') ? raw.slice(1) : raw;
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p === '/' || p === '') return '/';
  return p.replace(/\/+$/, '') || '/';
}

export function navigateHash(path: string): void {
  const next = path.startsWith('#') ? path : `#${path.startsWith('/') ? path : `/${path}`}`;
  if (typeof window !== 'undefined') window.location.hash = next;
}

export function useHashRoute(): string {
  const [route, setRoute] = useState<string>(() => (typeof window !== 'undefined' ? normalizeHash() : '/'));

  const sync = useCallback(() => {
    setRoute(normalizeHash());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [sync]);

  return route;
}
