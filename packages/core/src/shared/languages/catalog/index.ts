import rawGeneratedCatalog from './languages.json' with { type: 'json' };

import type { TranslateTargetLanguage } from '../../../types/languages/index.js';
import { normalizeLanguageCode } from '../normalize.js';

/**
 * Browser-safe catalog barrel.
 * Node-only generation/bootstrap helpers are intentionally excluded from this file.
 */

export const generatedLanguageCatalog = rawGeneratedCatalog as TranslateTargetLanguage[];

export function buildLanguageCatalog(raw: readonly TranslateTargetLanguage[]): readonly TranslateTargetLanguage[] {
  return Object.freeze(raw.map((r) => ({ ...r, code: normalizeLanguageCode(r.code) })));
}

/** Case-insensitive substring match on code, English, or native name. */
export function filterLanguageCatalog(
  catalog: readonly TranslateTargetLanguage[],
  filter: string | undefined,
): TranslateTargetLanguage[] {
  const all = [...catalog];
  const q = filter?.trim().toLowerCase();
  if (!q) return all.sort((a, b) => a.code.localeCompare(b.code));
  return all
    .filter(
      (r) =>
        r.code.includes(q) ||
        r.english.toLowerCase().includes(q) ||
        r.native.toLowerCase().includes(q),
    )
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function getLanguageByCodeFromCatalog(
  catalog: readonly TranslateTargetLanguage[],
  code: string,
): TranslateTargetLanguage | undefined {
  const n = normalizeLanguageCode(code);
  return catalog.find((r) => r.code === n);
}

/**
 * Suggest catalog codes for an unknown input: substring match, then
 * codes sharing the first two characters, then alphabetical fill.
 */
export function suggestCatalogCodesForInvalidInputFromCatalog(
  catalog: readonly TranslateTargetLanguage[],
  code: string,
  maxCodesInCatalogHint = 5,
): string[] {
  const n = normalizeLanguageCode(code);
  const all = [...catalog].sort((a, b) => a.code.localeCompare(b.code));
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (c: string): void => {
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  };

  for (const r of filterLanguageCatalog(catalog, n)) {
    push(r.code);
    if (out.length >= maxCodesInCatalogHint) return out;
  }
  if (n.length >= 2) {
    const prefix = n.slice(0, 2);
    for (const r of all) {
      if (r.code.startsWith(prefix)) push(r.code);
      if (out.length >= maxCodesInCatalogHint) return out;
    }
  }
  for (const r of all) {
    push(r.code);
    if (out.length >= maxCodesInCatalogHint) return out;
  }
  return out;
}
