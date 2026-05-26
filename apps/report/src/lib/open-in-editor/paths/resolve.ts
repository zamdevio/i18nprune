import type { ResolvedFileTarget } from '../types.js';

/** Join project cwd with a payload path (relative or absolute). Does not mutate payload strings. */
export function resolveAbsolutePath(cwd: string, payloadPath: string): ResolvedFileTarget {
  const f = payloadPath.replace(/\\/g, '/');
  if (f.startsWith('/')) return { absolutePath: f };
  if (/^[A-Za-z]:\//.test(f)) return { absolutePath: f };
  const base = cwd.replace(/\\/g, '/').replace(/\/$/, '');
  const rel = f.replace(/^\.\//, '');
  return { absolutePath: `${base}/${rel}` };
}
