import { readFileSync } from 'node:fs';

import type { TranslateTargetLanguage } from '@i18nprune/core/types';

import { resolveDefaultLanguagesJsonPath } from './paths.js';
import { writeGeneratedLanguageCatalogToPath } from './write.js';

function isLanguageRow(value: unknown): value is TranslateTargetLanguage {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<TranslateTargetLanguage>;
  return (
    typeof row.code === 'string' &&
    typeof row.english === 'string' &&
    typeof row.native === 'string' &&
    (row.direction === 'ltr' || row.direction === 'rtl')
  );
}

function isLanguageCatalog(value: unknown): value is TranslateTargetLanguage[] {
  return Array.isArray(value) && value.every(isLanguageRow);
}

/**
 * Node-only: if `languages.json` is missing, empty, or invalid, regenerate it from `scripts/catalog/codes.json`.
 * Call once from the CLI entrypoint; do not import from browser bundles.
 *
 * No-op outside the i18nprune monorepo (published npm installs ship the catalog via `@i18nprune/core`).
 */
export function ensureLanguageCatalogFile(): void {
  const targetFile = resolveDefaultLanguagesJsonPath();
  if (!targetFile) return;

  try {
    const content = readFileSync(targetFile, 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (isLanguageCatalog(parsed) && parsed.length > 0) {
      return;
    }
  } catch {
    // regenerate
  }
  writeGeneratedLanguageCatalogToPath(targetFile);
}
