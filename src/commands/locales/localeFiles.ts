import fs from 'node:fs';
import { excludeSourceLocaleSlugs } from '@/core/locales/source.js';
import { style } from '@/utils/style/index.js';

/** How many locale slugs to print before `(+N more)` in error hints (matches catalog hint). */
const MAX_SLUGS_IN_HINT = 5;

/**
 * Comma-separated slugs for error messages; if more than {@link MAX_SLUGS_IN_HINT}, show only the first five
 * and tell the user to run `i18nprune locales list`.
 * When **`sourceLocalePath`** is set, the **source locale** basename is omitted (not a translation target).
 */
export function formatLocaleSlugHint(slugs: string[], sourceLocalePath?: string): string {
  const list =
    sourceLocalePath !== undefined ? excludeSourceLocaleSlugs(slugs, sourceLocalePath) : slugs;
  if (list.length === 0) return '(none)';
  if (list.length <= MAX_SLUGS_IN_HINT) return list.join(', ');
  const shown = list.slice(0, MAX_SLUGS_IN_HINT).join(', ');
  return `${shown} ${style.dim(`(+${list.length - MAX_SLUGS_IN_HINT} more)`)}. ${style.dim(`Run ${style.reset(style.accent('i18nprune locales list'))} ${style.dim('for the full list.')}`)}`;
}

/** Basenames without `.json` for locale files (excludes `*.meta.json`). */
export function listLocaleJsonSlugs(absLocalesDir: string): string[] {
  if (!fs.existsSync(absLocalesDir) || !fs.statSync(absLocalesDir).isDirectory()) {
    return [];
  }
  return fs
    .readdirSync(absLocalesDir)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.meta.json'))
    .map((f) => f.slice(0, -'.json'.length))
    .sort((a, b) => a.localeCompare(b));
}

export function resolveCanonicalSlug(requested: string, candidates: string[]): string | undefined {
  const lower = requested.trim().toLowerCase();
  return candidates.find((c) => c.toLowerCase() === lower);
}
