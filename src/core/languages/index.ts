import { I18nPruneError } from '@/core/errors/index.js';
import type { TranslateTargetLanguage } from '@/types/core/languages/catalog.js';
import { style } from '@/utils/style/index.js';
import catalogJson from './languages.json' with { type: 'json' };

const MAX_CODES_IN_CATALOG_HINT = 5;

export type { TranslateTargetLanguage };

let cached: readonly TranslateTargetLanguage[] | null = null;

function loadCatalog(): readonly TranslateTargetLanguage[] {
  if (cached) return cached;
  const raw = catalogJson as TranslateTargetLanguage[];
  cached = Object.freeze(raw.map((r) => ({ ...r, code: normalizeLanguageCode(r.code) })));
  return cached;
}

/** Normalize user input: trim, lowercase, `_` → `-`. */
export function normalizeLanguageCode(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-');
}

/** Case-insensitive substring match on code, English, or native name. */
export function filterLanguages(filter: string | undefined): TranslateTargetLanguage[] {
  const all = [...loadCatalog()];
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

export function getLanguageByCode(code: string): TranslateTargetLanguage | undefined {
  const n = normalizeLanguageCode(code);
  return loadCatalog().find((r) => r.code === n);
}

/**
 * Suggest catalog codes for an unknown input: substring match (see {@link filterLanguages}), then
 * codes sharing the first two characters, then alphabetical fill — up to {@link MAX_CODES_IN_CATALOG_HINT}.
 */
export function suggestCatalogCodesForInvalidInput(code: string): string[] {
  const n = normalizeLanguageCode(code);
  const all = [...loadCatalog()].sort((a, b) => a.code.localeCompare(b.code));
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (c: string): void => {
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  };

  for (const r of filterLanguages(n)) {
    push(r.code);
    if (out.length >= MAX_CODES_IN_CATALOG_HINT) return out;
  }
  if (n.length >= 2) {
    const prefix = n.slice(0, 2);
    for (const r of all) {
      if (r.code.startsWith(prefix)) push(r.code);
      if (out.length >= MAX_CODES_IN_CATALOG_HINT) return out;
    }
  }
  for (const r of all) {
    push(r.code);
    if (out.length >= MAX_CODES_IN_CATALOG_HINT) return out;
  }
  return out;
}

/** Styled hint line (codes + “(+N more)” + `i18nprune languages`) — same policy as `formatLocaleSlugHint`. */
export function formatCatalogLanguageHint(invalidCode: string): string {
  const suggested = suggestCatalogCodesForInvalidInput(invalidCode);
  const total = loadCatalog().length;
  if (suggested.length === 0 || total === 0) {
    return `${style.dim(`Run ${style.reset(style.accent('i18nprune languages'))} ${style.dim('for supported codes.')}`)}`;
  }
  const shown = suggested.slice(0, MAX_CODES_IN_CATALOG_HINT);
  const shownStr = shown.join(', ');
  if (total <= MAX_CODES_IN_CATALOG_HINT) {
    return `${shownStr}. ${style.dim(`Run ${style.reset(style.accent('i18nprune languages'))} ${style.dim('for the full list.')}`)}`;
  }
  const more = total - shown.length;
  return `${shownStr} ${style.dim(`(+${String(more)} more)`)}. ${style.dim(`Run ${style.reset(style.accent('i18nprune languages'))} ${style.dim('for the full list.')}`)}`;
}

export function validateTargetLanguageCode(code: string): void {
  if (!getLanguageByCode(code)) {
    throw new I18nPruneError(
      `Unsupported language code "${code}" — try: ${formatCatalogLanguageHint(code)}`,
      'USAGE',
    );
  }
}
