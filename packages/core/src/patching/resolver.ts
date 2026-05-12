import {
  buildLanguageCatalog,
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
} from '../shared/languages/catalog/index.js';
import type { LocaleDirection } from '../types/patching/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { parseJsonText } from '../shared/json/parse.js';
import { recommendedLocaleDirection } from './locales.js';

export type LocaleConfigMismatch = {
  code: string;
  field: 'englishName' | 'nativeName' | 'direction';
  current: string;
  recommended: string;
};

export type ResolvePatchingLocalesResult =
  | {
      ok: false;
      error: 'parse_error' | 'invalid_schema';
      message: string;
    }
  | {
      ok: true;
      nextConfigText: string;
      autofilled: Array<{ code: string; field: 'englishName' | 'nativeName' | 'direction'; value: string }>;
      mismatches: LocaleConfigMismatch[];
      changed: boolean;
    };

export function resolvePatchingConfigLocales(
  configText: string,
  options?: { applyCatalogMismatches?: boolean },
): ResolvePatchingLocalesResult {
  const applyCatalogMismatches = options?.applyCatalogMismatches === true;
  let parsed: unknown;
  try {
    parsed = parseJsonText(configText);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: 'parse_error', message };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'invalid_schema', message: 'config JSON must be an object' };
  }

  const cfg = parsed as Record<string, unknown>;
  if (!Array.isArray(cfg.locales)) {
    return { ok: false, error: 'invalid_schema', message: 'config JSON must contain locales[] array' };
  }

  const catalog = buildLanguageCatalog(generatedLanguageCatalog);
  const autofilled: Array<{ code: string; field: 'englishName' | 'nativeName' | 'direction'; value: string }> = [];
  const mismatches: LocaleConfigMismatch[] = [];
  const nextLocales = cfg.locales.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const row = { ...(entry as Record<string, unknown>) };
    const rawCode = row.code;
    if (typeof rawCode !== 'string' || rawCode.trim().length === 0) return null;
    const code = normalizeLanguageCode(rawCode);
    const cat = getLanguageByCodeFromCatalog(catalog, code);

    const ensure = <T extends 'englishName' | 'nativeName' | 'direction'>(
      field: T,
      recommended: string,
      isValid: (value: unknown) => boolean,
    ): void => {
      const current = row[field];
      if (!isValid(current)) {
        row[field] = recommended;
        autofilled.push({ code, field, value: recommended });
        return;
      }
      const currentStr = String(current);
      if (cat && currentStr !== recommended) {
        mismatches.push({ code, field, current: currentStr, recommended });
        if (applyCatalogMismatches) row[field] = recommended;
      }
    };

    ensure('englishName', cat?.english ?? code, (v) => typeof v === 'string' && v.trim().length > 0);
    ensure('nativeName', cat?.native ?? code, (v) => typeof v === 'string' && v.trim().length > 0);
    ensure(
      'direction',
      recommendedLocaleDirection(code, cat?.direction) as LocaleDirection,
      (v) => v === 'ltr' || v === 'rtl',
    );
    row.code = code;
    return row;
  });

  if (nextLocales.some((x) => x == null)) {
    return { ok: false, error: 'invalid_schema', message: 'each locales[] entry must be an object with string code' };
  }

  const next = { ...cfg, locales: nextLocales as Record<string, unknown>[] };
  const nextConfigText = `${JSON.stringify(next, null, 2)}\n`;
  return {
    ok: true,
    nextConfigText,
    autofilled,
    mismatches,
    changed: nextConfigText !== configText,
  };
}
