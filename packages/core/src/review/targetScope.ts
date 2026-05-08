import type { RuntimePathPort } from '../types/runtime/path.js';

/**
 * Parse **`review --target`**: omit or **`all`** → all non-source locale files; otherwise
 * comma-separated basenames (`ja`, `ja,ar`, optional `.json` suffix).
 */
export function parseReviewTargetCodes(target: string | undefined): string[] | undefined {
  if (target === undefined) return undefined;
  const t = target.trim();
  if (t === '') return undefined;
  if (t.toLowerCase() === 'all') return undefined;
  const parts = t
    .split(',')
    .map((s) => s.trim().replace(/\.json$/i, ''))
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

/** Keep locale files whose basename (without `.json`) is in `codes` (case-insensitive). */
export function filterLocaleFilesForReview(
  path: RuntimePathPort,
  files: string[],
  codes: string[] | undefined,
): string[] {
  if (!codes?.length) return files;
  const want = new Set(codes.map((c) => c.toLowerCase()));
  return files.filter((f) => want.has(path.basename(f, '.json').toLowerCase()));
}
