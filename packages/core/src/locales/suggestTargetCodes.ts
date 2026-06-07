import {
  buildLanguageCatalog,
  generatedLanguageCatalog,
} from '../shared/languages/catalog/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { MAX_LOCALE_TARGET_SUGGESTIONS } from '../shared/constants/locales.js';

function compactLocaleCode(code: string): string {
  return normalizeLanguageCode(code).replace(/[^a-z0-9]/g, '');
}

/** Suggest existing project locale codes when `--target` does not match a file (typo / wrong tag). */
export function suggestExistingLocaleTargets(input: string, existingCodes: readonly string[]): string[] {
  const normalizedInput = normalizeLanguageCode(input);
  const compactInput = compactLocaleCode(input);
  const normalizedExisting = [...existingCodes].map((code) => normalizeLanguageCode(code)).sort((a, b) => a.localeCompare(b));
  const existing = new Set(normalizedExisting);
  const out: string[] = [];
  const push = (code: string): void => {
    if (existing.has(code) && !out.includes(code)) out.push(code);
  };

  for (const code of normalizedExisting) {
    const compactCode = compactLocaleCode(code);
    if (compactInput.length > 0 && compactInput === compactCode) push(code);
    if (normalizedInput.length >= 2 && code.startsWith(normalizedInput.slice(0, 2))) push(code);
  }

  const catalog = buildLanguageCatalog(generatedLanguageCatalog);
  for (const row of catalog) {
    const rowCompact = compactLocaleCode(row.code);
    if (compactInput.length > 0 && compactInput === rowCompact) push(row.code);
    if (normalizedInput.length >= 2 && row.code.startsWith(normalizedInput.slice(0, 2))) push(row.code);
    if (normalizedInput.length >= 3) {
      const q = normalizedInput.toLowerCase();
      if (row.english.toLowerCase().startsWith(q) || row.native.toLowerCase().startsWith(q)) {
        push(row.code);
      }
    }
  }

  return out.slice(0, MAX_LOCALE_TARGET_SUGGESTIONS);
}
