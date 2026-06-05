import {
  DOCS_URL,
  GITHUB_REPO_URL,
  LANDING_URL,
  META_WORKER_URL,
  PRODUCT_NAME,
  RELEASES_URL,
  REPORT_URL,
  WEB_APP_URL,
  WORKER_URL,
} from './constants.js';
import { SURFACE_COPY } from './surfaces.js';

export const BRAND_THEME_COLOR = '#04140f' as const;
export const BRAND_BACKGROUND_COLOR = '#020a08' as const;

export type WebManifestSurface =
  | 'landing'
  | 'docs'
  | 'releases'
  | 'web'
  | 'report'
  | 'worker'
  | 'meta';

export type WebManifestShortcut = {
  name: string;
  short_name: string;
  url: string;
  description?: string;
};

export type SiteWebManifest = {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  id: string;
  display: 'standalone';
  theme_color: string;
  background_color: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
  shortcuts: WebManifestShortcut[];
};

const ICONS: SiteWebManifest['icons'] = [
  { src: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
  { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
  { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
  {
    src: '/android-chrome-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
];

function surfaceCopy(surface: WebManifestSurface): { title: string; description: string; url: string } {
  if (surface === 'docs') return SURFACE_COPY.docs;
  if (surface === 'worker') {
    return {
      title: `${PRODUCT_NAME} Worker API`,
      description:
        'OpenAPI reference for i18nprune hosted project snapshots, validate/report reads, and share workflows on the edge.',
      url: `${WORKER_URL}/docs`,
    };
  }
  if (surface === 'meta') {
    return {
      title: `${PRODUCT_NAME} Meta API`,
      description: 'Version, GitHub, and npm metadata for i18nprune — consumed by docs, landing, and CI.',
      url: `${META_WORKER_URL}/docs`,
    };
  }
  return SURFACE_COPY[surface];
}

function shortcutsFor(surface: WebManifestSurface): WebManifestShortcut[] {
  switch (surface) {
    case 'landing':
      return [
        { name: 'Documentation', short_name: 'Docs', url: `${DOCS_URL}/`, description: SURFACE_COPY.docs.description },
        { name: 'Web runtime', short_name: 'Web', url: `${WEB_APP_URL}/`, description: SURFACE_COPY.web.description },
        { name: 'Releases', short_name: 'Releases', url: `${RELEASES_URL}/`, description: SURFACE_COPY.releases.description },
        { name: 'GitHub', short_name: 'GitHub', url: GITHUB_REPO_URL },
      ];
    case 'docs':
      return [
        { name: 'CLI commands', short_name: 'Commands', url: `${DOCS_URL}/commands/`, description: 'i18nprune CLI reference' },
        { name: 'Web runtime', short_name: 'Web', url: `${WEB_APP_URL}/`, description: SURFACE_COPY.web.description },
        { name: 'Releases', short_name: 'Releases', url: `${RELEASES_URL}/`, description: SURFACE_COPY.releases.description },
        { name: 'Product home', short_name: 'Home', url: `${LANDING_URL}/`, description: SURFACE_COPY.landing.description },
      ];
    case 'releases':
      return [
        { name: 'Documentation', short_name: 'Docs', url: `${DOCS_URL}/`, description: SURFACE_COPY.docs.description },
        { name: 'Product home', short_name: 'Home', url: `${LANDING_URL}/`, description: SURFACE_COPY.landing.description },
        { name: 'GitHub', short_name: 'GitHub', url: GITHUB_REPO_URL },
      ];
    case 'web':
      return [
        { name: 'Documentation', short_name: 'Docs', url: `${DOCS_URL}/`, description: SURFACE_COPY.docs.description },
        { name: 'Report viewer', short_name: 'Report', url: `${REPORT_URL}/`, description: SURFACE_COPY.report.description },
        { name: 'Product home', short_name: 'Home', url: `${LANDING_URL}/`, description: SURFACE_COPY.landing.description },
      ];
    case 'report':
      return [
        { name: 'Web runtime', short_name: 'Web', url: `${WEB_APP_URL}/`, description: SURFACE_COPY.web.description },
        { name: 'Documentation', short_name: 'Docs', url: `${DOCS_URL}/`, description: SURFACE_COPY.docs.description },
        { name: 'Product home', short_name: 'Home', url: `${LANDING_URL}/`, description: SURFACE_COPY.landing.description },
      ];
    case 'worker':
      return [
        { name: 'OpenAPI docs', short_name: 'API', url: `${WORKER_URL}/docs`, description: 'Worker API reference' },
        { name: 'Documentation', short_name: 'Docs', url: `${DOCS_URL}/`, description: SURFACE_COPY.docs.description },
        { name: 'Product home', short_name: 'Home', url: `${LANDING_URL}/`, description: SURFACE_COPY.landing.description },
      ];
    case 'meta':
      return [
        { name: 'OpenAPI docs', short_name: 'API', url: `${META_WORKER_URL}/docs`, description: 'Meta API reference' },
        { name: 'Documentation', short_name: 'Docs', url: `${DOCS_URL}/`, description: SURFACE_COPY.docs.description },
        { name: 'Product home', short_name: 'Home', url: `${LANDING_URL}/`, description: SURFACE_COPY.landing.description },
      ];
  }
}

/** Build a PWA manifest JSON object for a web surface. Icon paths are site-root relative. */
export function buildSiteWebManifest(surface: WebManifestSurface): SiteWebManifest {
  const copy = surfaceCopy(surface);
  const startUrl = copy.url;
  const shortName =
    surface === 'landing'
      ? PRODUCT_NAME
      : surface === 'docs'
        ? `${PRODUCT_NAME} Docs`
        : surface === 'worker'
          ? `${PRODUCT_NAME} Worker`
          : surface === 'meta'
            ? `${PRODUCT_NAME} Meta`
            : copy.title.replace(`${PRODUCT_NAME} · `, '').replace(`${PRODUCT_NAME} `, '');

  return {
    name: copy.title,
    short_name: shortName,
    description: copy.description,
    start_url: startUrl,
    scope: '/',
    id: startUrl,
    display: 'standalone',
    theme_color: BRAND_THEME_COLOR,
    background_color: BRAND_BACKGROUND_COLOR,
    icons: ICONS,
    shortcuts: shortcutsFor(surface),
  };
}
