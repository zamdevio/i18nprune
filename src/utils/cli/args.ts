import { normalizeLanguageCode } from '@/core/languages/index.js';

export const ALL_LANG_TOKEN = 'all';

/** Comma-separated locale basenames, or **`all`** (case-insensitive). */
export function parseLocaleCodesList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((c) => normalizeLanguageCode(c));
}

export function isAllLangToken(raw: string): boolean {
  return raw.trim().toLowerCase() === ALL_LANG_TOKEN;
}

/**
 * **`sync`**: omit → all non-source locales; **`all`** → same; else comma-separated codes.
 */
export function parseSyncLangSelection(
  lang: string | undefined,
): { mode: 'all' } | { mode: 'codes'; codes: string[] } {
  const primary = lang?.trim();
  if (primary) {
    if (isAllLangToken(primary)) return { mode: 'all' };
    return { mode: 'codes', codes: parseLocaleCodesList(primary) };
  }
  return { mode: 'all' };
}
