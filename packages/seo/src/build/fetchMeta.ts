import { defaultProductMetaSnapshot, parseMetaV1ForSeo } from '../meta.js';
import { META_V1_URL } from '../meta.js';
import type { ProductMetaSnapshot } from '../types.js';

/** Fetch live product metadata for build-time SEO injection (Node / Vite only). */
export async function fetchMetaSnapshotForBuild(
  timeoutMs = 5000,
): Promise<ProductMetaSnapshot> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(META_V1_URL, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return defaultProductMetaSnapshot();
    return parseMetaV1ForSeo(await res.json()) ?? defaultProductMetaSnapshot();
  } catch {
    return defaultProductMetaSnapshot();
  }
}
