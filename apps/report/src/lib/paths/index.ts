/** Join project cwd with a path as emitted by the report (often relative). */
export function toAbsolutePath(cwd: string, filePath: string): string {
  const f = filePath.replace(/\\/g, '/');
  if (f.startsWith('/')) return f;
  if (/^[A-Za-z]:\//.test(f)) return f;
  const base = cwd.replace(/\\/g, '/').replace(/\/$/, '');
  const rel = f.replace(/^\.\//, '');
  return `${base}/${rel}`;
}
