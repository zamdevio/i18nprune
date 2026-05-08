import {
  buildLanguageCatalog,
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
} from '../shared/languages/catalog/index.js';
import { languageOftenRtl } from '../shared/languages/rtlHint.js';
import type { PatchingAction, PatchingDiagnostic, PatchingLocaleRecord } from '../types/patching/index.js';
import { codeSet } from './utils.js';

export function recommendedLocaleDirection(
  code: string,
  catalogDirection: unknown,
): 'ltr' | 'rtl' {
  if (catalogDirection === 'ltr' || catalogDirection === 'rtl') return catalogDirection;
  return languageOftenRtl(code) ? 'rtl' : 'ltr';
}

export function parseLocaleRecords(parsed: unknown): PatchingLocaleRecord[] | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const cfg = parsed as { locales?: unknown };
  if (!Array.isArray(cfg.locales)) return null;
  const records: PatchingLocaleRecord[] = [];
  for (const item of cfg.locales) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    if (
      typeof row.code !== 'string' ||
      typeof row.englishName !== 'string' ||
      typeof row.nativeName !== 'string' ||
      (row.direction !== 'ltr' && row.direction !== 'rtl')
    ) {
      return null;
    }
    records.push({
      code: row.code,
      englishName: row.englishName,
      nativeName: row.nativeName,
      direction: row.direction,
      ...row,
    });
  }
  return records;
}

export function applyLocaleAction(
  current: readonly PatchingLocaleRecord[],
  action: PatchingAction,
  changedLocaleCodes: readonly string[],
): PatchingLocaleRecord[] {
  const catalog = buildLanguageCatalog(generatedLanguageCatalog);
  const byCode = new Map(current.map((row) => [row.code, row]));
  const delta = codeSet(changedLocaleCodes);
  if (action === 'delete_locales') {
    const remove = new Set(delta);
    return current.filter((row) => !remove.has(row.code));
  }
  const out = [...current];
  for (const code of delta) {
    if (byCode.has(code)) continue;
    const cat = getLanguageByCodeFromCatalog(catalog, code);
    out.push({
      code,
      englishName: cat?.english ?? code,
      nativeName: cat?.native ?? code,
      direction: recommendedLocaleDirection(code, cat?.direction),
    });
  }
  return out.sort((a, b) => a.code.localeCompare(b.code));
}

export function catalogDiagnostics(records: readonly PatchingLocaleRecord[]): PatchingDiagnostic[] {
  const catalog = buildLanguageCatalog(generatedLanguageCatalog);
  const diagnostics: PatchingDiagnostic[] = [];
  for (const row of records) {
    const cat = getLanguageByCodeFromCatalog(catalog, row.code);
    if (!cat) continue;
    if (row.englishName !== cat.english) {
      diagnostics.push({
        severity: 'warn',
        code: 'i18nprune.patching.catalog_mismatch_english_name',
        message: `patching: ${row.code} englishName differs from catalog ("${row.englishName}" vs "${cat.english}")`,
        docPath: 'patching/loader.md',
      });
    }
    if (row.nativeName !== cat.native) {
      diagnostics.push({
        severity: 'warn',
        code: 'i18nprune.patching.catalog_mismatch_native_name',
        message: `patching: ${row.code} nativeName differs from catalog ("${row.nativeName}" vs "${cat.native}")`,
        docPath: 'patching/loader.md',
      });
    }
    const recommendedDirection = recommendedLocaleDirection(row.code, cat.direction);
    if (row.direction !== recommendedDirection) {
      diagnostics.push({
        severity: 'warn',
        code: 'i18nprune.patching.catalog_mismatch_direction',
        message: `patching: ${row.code} direction differs from catalog ("${row.direction}" vs "${recommendedDirection}")`,
        docPath: 'patching/loader.md',
      });
    }
  }
  return diagnostics;
}

export function configSizeDiagnostics(
  configText: string,
  localeCount: number,
  sizeLimitBytes: number,
): PatchingDiagnostic[] {
  const hardMax = sizeLimitBytes;
  const soft = Math.max(4096, localeCount * 256 + 1024);
  const out: PatchingDiagnostic[] = [];
  if (configText.length > hardMax) {
    out.push({
      severity: 'error',
      code: 'i18nprune.patching.config_too_large',
      message: `patching: config exceeds size limit (${String(configText.length)} > ${String(hardMax)} bytes)`,
      docPath: 'patching/loader.md',
    });
    return out;
  }
  if (configText.length > soft) {
    out.push({
      severity: 'warn',
      code: 'i18nprune.patching.config_size_anomaly',
      message: `patching: config size (${String(configText.length)} bytes) is unusually high for ${String(localeCount)} locale record(s); review manually`,
      docPath: 'patching/loader.md',
    });
  }
  return out;
}
