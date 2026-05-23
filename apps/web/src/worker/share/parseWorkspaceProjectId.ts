/** Parse worker project id from a share URL or raw 16-char hex id. */
export function parseWorkspaceProjectId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('#/workspace')) {
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
