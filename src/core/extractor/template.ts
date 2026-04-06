/** Fully resolved root, or prefix root cut at first unknown `${…}` (cleanup heuristic). */
export function templateKeyRoot(fragment: string): string {
  const cut = fragment.split('${')[0] ?? fragment;
  const parts = cut.split('.').filter(Boolean);
  return parts[0] ?? '';
}
