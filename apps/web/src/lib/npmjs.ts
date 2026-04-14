/** Published installable name on npm; must match root `package.json`. */
export const NPM_PACKAGE_NAME = "@zamdevio/i18nprune" as const;

/** Latest `dist-tags.latest` from the registry, or `null` on failure. */
export async function fetchLatestPublishedVersion(): Promise<string | null> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(NPM_PACKAGE_NAME)}/latest`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: unknown };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}
