import type { RuntimePathPort } from '../types/runtime/path.js';
import { I18nPruneError } from '../shared/errors/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { assertNotSourceTargetLocale, excludeSourceLocaleSlugs } from './source.js';

export const ALL_LOCALES_TOKEN = 'all';

export type ResolveLocaleTargetCodesInput = {
  commandName: string;
  rawTarget: string;
  localeSlugs: string[];
  sourceLocalePath: string;
  path: RuntimePathPort;
};

/** Comma-separated locale basenames, or `all` (case-insensitive). */
export function parseLocaleCodesList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((c) => normalizeLanguageCode(c));
}

export function isAllLocaleToken(raw: string): boolean {
  return raw.trim().toLowerCase() === ALL_LOCALES_TOKEN;
}

/** Normalized target selector (single value, list, or `all`). */
export function pickTargetSelector(target?: string): string | undefined {
  const t = target?.trim();
  if (t) return t;
  return undefined;
}

/**
 * `sync`: omit -> all non-source locales; `all` -> same; else comma-separated codes.
 */
export function parseSyncLangSelection(
  lang: string | undefined,
): { mode: 'all' } | { mode: 'codes'; codes: string[] } {
  const primary = lang?.trim();
  if (primary) {
    if (isAllLocaleToken(primary)) return { mode: 'all' };
    return { mode: 'codes', codes: parseLocaleCodesList(primary) };
  }
  return { mode: 'all' };
}

export function resolveTargetLocaleSlugs(
  path: RuntimePathPort,
  localeSlugs: string[],
  sourceLocalePath: string,
): string[] {
  return excludeSourceLocaleSlugs(path, localeSlugs, sourceLocalePath);
}

/** Pure target resolution with no prompting or CLI side effects. */
export function resolveLocaleTargetCodes(input: ResolveLocaleTargetCodesInput): string[] {
  const { commandName, rawTarget, localeSlugs, sourceLocalePath, path } = input;
  const targetSlugs = resolveTargetLocaleSlugs(path, localeSlugs, sourceLocalePath);
  if (targetSlugs.length === 0) {
    throw new I18nPruneError(`${commandName}: no target locale files found in localesDir`, 'USAGE');
  }
  const selected = pickTargetSelector(rawTarget);
  if (!selected) {
    throw new I18nPruneError(`${commandName} requires --target <code[,code]|all>`, 'USAGE');
  }
  if (isAllLocaleToken(selected)) {
    return targetSlugs.map((x) => normalizeLanguageCode(x));
  }
  const parsed = parseLocaleCodesList(selected);
  for (const code of parsed) {
    assertNotSourceTargetLocale(commandName, code, sourceLocalePath, {
      paths: { sourceLocale: sourceLocalePath },
      path,
    });
    if (!targetSlugs.some((x) => normalizeLanguageCode(x) === code)) {
      throw new I18nPruneError(`${commandName}: locale file not found for target "${code}"`, 'USAGE');
    }
  }
  return parsed;
}
