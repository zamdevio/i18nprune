/**
 * OG PNG fonts are static assets under `/fonts/og/` (synced from `@i18nprune/seo` assets).
 * Regenerate from @fontsource/* subsets when updating typography.
 */
const OG_FONT_PATHS = [
  '/fonts/og/outfit-700.woff2',
  '/fonts/og/jetbrains-mono-400.woff2',
  '/fonts/og/jetbrains-mono-500.woff2',
  '/fonts/og/ibm-plex-sans-500.woff2',
] as const;

let fontCache: Uint8Array[] | undefined;

/** Load Latin subsets for resvg (matches `font-family` in `ogCard.ts`). */
export async function loadOgFontBuffers(origin: string): Promise<Uint8Array[]> {
  if (fontCache) return fontCache;
  const buffers = await Promise.all(
    OG_FONT_PATHS.map(async (path) => {
      const res = await fetch(new URL(path, origin), {
        cf: { cacheTtl: 86400, cacheEverything: true },
      });
      if (!res.ok) {
        throw new Error(`OG font fetch failed (${res.status}): ${path}`);
      }
      return new Uint8Array(await res.arrayBuffer());
    }),
  );
  fontCache = buffers;
  return buffers;
}
