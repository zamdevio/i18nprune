import type { RuntimeFsPort } from '@i18nprune/core';
import type { RuntimePathPort } from '@i18nprune/core';
import { excludeSourceLocaleSlugs } from '@i18nprune/core';
import { existsRuntimeFsSync, listRuntimeFsDirSync } from '@i18nprune/core';

/** How many locale slugs to print before `(+N more)` in error hints (matches catalog hint). */
const MAX_SLUGS_IN_HINT = 5;

/** Plain-text variant for JSON envelopes and structured issue messages. */
export function formatLocaleSlugHintPlain(
  slugs: string[],
  sourceLocalePath: string | undefined,
  pathPort: RuntimePathPort,
): string {
  const list =
    sourceLocalePath !== undefined
      ? excludeSourceLocaleSlugs(pathPort, slugs, sourceLocalePath)
      : slugs;
  if (list.length === 0) return '(none)';
  if (list.length <= MAX_SLUGS_IN_HINT) return list.join(', ');
  const shown = list.slice(0, MAX_SLUGS_IN_HINT).join(', ');
  return `${shown} (+${String(list.length - MAX_SLUGS_IN_HINT)} more). Run i18nprune locales list for the full list.`;
}

/** Basenames without `.json` for locale files (excludes `*.meta.json`). */
export function listLocaleJsonSlugs(absLocalesDir: string, fs: RuntimeFsPort): string[] {
  if (!existsRuntimeFsSync(absLocalesDir, fs)) return [];
  try {
    return listRuntimeFsDirSync(absLocalesDir, fs)
      .filter((e) => e.kind === 'file' && e.name.endsWith('.json') && !e.name.endsWith('.meta.json'))
      .map((e) => e.name.slice(0, -'.json'.length))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export function resolveCanonicalSlug(requested: string, candidates: string[]): string | undefined {
  const lower = requested.trim().toLowerCase();
  return candidates.find((c) => c.toLowerCase() === lower);
}
