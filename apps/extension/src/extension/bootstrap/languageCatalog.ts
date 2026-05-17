import { buildLanguageCatalog, generatedLanguageCatalog } from '@i18nprune/core';

export type LanguageCatalogRow = { code: string; english: string; native: string };

/** Slim rows for the webview (search / pick targets); built from core's generated catalog. */
export function getLanguageCatalogCompact(): LanguageCatalogRow[] {
  const catalog = buildLanguageCatalog(generatedLanguageCatalog);
  return catalog.map((r) => ({ code: r.code, english: r.english, native: r.native }));
}
