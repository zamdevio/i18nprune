/** Parse worker report id from a share URL or raw 16-char hex id (`/#/?id=`). */
export function parseReportShareId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('#')) {
      const hash = trimmed.slice(trimmed.indexOf('#'));
      const q = hash.indexOf('?');
      if (q >= 0) {
        const params = new URLSearchParams(hash.slice(q + 1));
        const id = params.get('id')?.trim();
        if (id) return id;
      }
    }
    if (trimmed.includes('://')) {
      const u = new URL(trimmed);
      const hashQ = u.hash.indexOf('?');
      if (hashQ >= 0) {
        const params = new URLSearchParams(u.hash.slice(hashQ + 1));
        const id = params.get('id')?.trim();
        if (id) return id;
      }
    }
  } catch {
    /* fall through */
  }
  if (/^[a-f0-9]{16}$/i.test(trimmed)) return trimmed;
  return null;
}

/** Read `?id=` from the current hash route (`#/?id=…`). */
export function readReportShareIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const body = hash.startsWith('#') ? hash.slice(1) : hash;
  const withSlash = body.startsWith('/') ? body : `/${body}`;
  const q = withSlash.indexOf('?');
  if (q < 0) return null;
  const id = new URLSearchParams(withSlash.slice(q + 1)).get('id')?.trim();
  return id && id.length > 0 ? id : null;
}
