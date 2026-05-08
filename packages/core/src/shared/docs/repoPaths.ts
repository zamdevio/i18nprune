/**
 * Normalize legacy `docPath` values to repo-root form under **`docs/`** for envelopes and integrators
 * (e.g. `commands/validate/README` → `docs/commands/validate/README` on disk).
 */
export function normalizeRepoDocPath(docPath: string): string {
  const t = docPath.trim();
  if (t === '') return t;
  if (t.startsWith('docs/')) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `docs/${t}`;
}
