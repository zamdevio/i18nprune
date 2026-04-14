import { NPM_REGISTRY_LATEST_URL } from '@/constants/update.js';

const FETCH_TIMEOUT_MS = 8000;

/**
 * Compare published semver `a` vs `b` (core x.y.z only). Returns true if `a` is newer than `b`.
 */
export function isPublishedVersionNewer(latest: string, current: string): boolean {
  const core = (s: string) => {
    const m = /^(\d+)\.(\d+)\.(\d+)/.exec(s.trim());
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])] as const;
  };
  const L = core(latest);
  const C = core(current);
  if (!L || !C) return false;
  for (let i = 0; i < 3; i++) {
    if (L[i] > C[i]) return true;
    if (L[i] < C[i]) return false;
  }
  return false;
}

export async function fetchLatestPublishedVersion(): Promise<string | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(NPM_REGISTRY_LATEST_URL, {
      signal: ac.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    const v = data.version;
    return typeof v === 'string' && v.length > 0 ? v : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
