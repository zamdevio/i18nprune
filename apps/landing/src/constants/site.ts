/** Public marketing site origin (Open Graph, canonical links). */
export const SITE_URL = "https://i18nprune.dev";

/** Dynamic OG share image — PNG for social crawlers; SVG at `/og.svg` for direct preview. */
export const OG_IMAGE_URL = `${SITE_URL}/og.png`;

/** Brand mark for `og:logo` (extension; not in core OGP — see ogp.me). */
export const OG_LOGO_URL = `${SITE_URL}/i18nprune.svg`;

/** Bootstrap URL for `GET /v1/meta` — all other public links come from that response (`links`). */
export const META_WORKER_URL = "https://meta.i18nprune.dev";
