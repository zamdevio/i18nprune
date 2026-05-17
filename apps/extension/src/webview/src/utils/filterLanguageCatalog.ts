/** Mirrors core `filterLanguageCatalog` for webview (no `@i18nprune/core` dep in the bundle). */
export type CatalogRow = { code: string; english: string; native: string };

export function filterLanguageCatalog(all: readonly CatalogRow[], q: string | undefined): CatalogRow[] {
  const query = q?.trim().toLowerCase();
  const rows = [...all];
  if (!query) return rows.sort((a, b) => a.code.localeCompare(b.code));
  return rows
    .filter(
      (r) =>
        r.code.includes(query) ||
        r.english.toLowerCase().includes(query) ||
        r.native.toLowerCase().includes(query),
    )
    .sort((a, b) => a.code.localeCompare(b.code));
}
