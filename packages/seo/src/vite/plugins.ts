import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { syncWebPublicAssets } from '../assets/sync.js';
import { fetchMetaSnapshotForBuild } from '../build/fetchMeta.js';
import { renderFaviconHeadTags, renderPageHeadTags } from '../head.js';
import type { WebManifestSurface } from '../manifest.js';
import type { PageHeadOptions } from '../head.js';
import {
  buildLandingGraph,
  buildReportRuntimeGraph,
  buildReleasesPortalGraph,
  buildWebRuntimeGraph,
} from '../jsonld.js';
import { ROBOTS_PRESETS, renderRobotsTxtPreset } from '../robots.js';
import { SURFACE_COPY } from '../surfaces.js';

export type RobotsPresetKey = keyof typeof ROBOTS_PRESETS;

export type SeoSurfaceKey = 'landing' | 'releases' | 'web' | 'report';

/** Minimal Vite plugin shape — avoids pinning Vite types across app version skew. */
export type VitePluginLike = {
  name: string;
  configureServer?: () => void | Promise<void>;
  buildStart?: () => void | Promise<void>;
  transformIndexHtml?: {
    order?: 'pre' | 'post';
    handler: (html: string) => string | Promise<string>;
  };
};

function writeRobots(publicDir: string, preset: RobotsPresetKey): void {
  writeFileSync(resolve(publicDir, 'robots.txt'), renderRobotsTxtPreset(preset), 'utf8');
}

/** Copy shared favicons, OG fonts, and `site.webmanifest` into a host `public/` dir (dev + build). */
export function syncWebAssetsPlugin(options: {
  surface: WebManifestSurface;
  publicDir: string;
  functionsDir?: string;
}): VitePluginLike {
  const sync = () => syncWebPublicAssets(options);
  return {
    name: 'i18nprune-seo-web-assets',
    configureServer() {
      sync();
    },
    buildStart() {
      sync();
    },
  };
}

/** Write `public/robots.txt` from `@i18nprune/seo` presets (dev + build). */
export function writeRobotsTxtPlugin(options: {
  preset: RobotsPresetKey;
  publicDir: string;
}): VitePluginLike {
  const sync = () => writeRobots(options.publicDir, options.preset);
  return {
    name: 'i18nprune-seo-robots',
    configureServer() {
      sync();
    },
    buildStart() {
      sync();
    },
  };
}

async function headForSurface(
  surface: SeoSurfaceKey,
  snapshot: Awaited<ReturnType<typeof fetchMetaSnapshotForBuild>>,
): Promise<PageHeadOptions> {
  const copy = SURFACE_COPY[surface];
  const openGraphBase = {
    title: copy.title,
    description: copy.description,
    url: copy.url,
    type: 'website' as const,
    siteName: copy.title,
    ...('ogImage' in copy && copy.ogImage ? { imageUrl: copy.ogImage, imageAlt: copy.title } : {}),
  };

  switch (surface) {
    case 'landing':
      return {
        title: copy.title,
        description: copy.description,
        canonicalUrl: copy.url,
        openGraph: openGraphBase,
        twitter: {
          card: 'summary_large_image',
          title: copy.title,
          description: copy.description,
          site: '@zamdevio',
          ...('ogImage' in copy && copy.ogImage
            ? { imageUrl: copy.ogImage, imageAlt: copy.title }
            : {}),
        },
        jsonLd: buildLandingGraph(snapshot),
      };
    case 'releases':
      return {
        title: copy.title,
        description: copy.description,
        canonicalUrl: copy.url,
        openGraph: openGraphBase,
        twitter: {
          card: 'summary_large_image',
          title: copy.title,
          description: copy.description,
          ...('ogImage' in copy && copy.ogImage
            ? { imageUrl: copy.ogImage, imageAlt: copy.title }
            : {}),
        },
        jsonLd: buildReleasesPortalGraph(snapshot),
      };
    case 'web':
      return {
        title: copy.title,
        description: copy.description,
        canonicalUrl: copy.url,
        openGraph: openGraphBase,
        twitter: {
          card: 'summary_large_image',
          title: copy.title,
          description: copy.description,
          ...('ogImage' in copy && copy.ogImage
            ? { imageUrl: copy.ogImage, imageAlt: copy.title }
            : {}),
        },
        jsonLd: buildWebRuntimeGraph(),
      };
    case 'report':
      return {
        title: copy.title,
        description: copy.description,
        canonicalUrl: copy.url,
        robots: 'index,follow',
        openGraph: openGraphBase,
        twitter: {
          card: 'summary_large_image',
          title: copy.title,
          description: copy.description,
          ...('ogImage' in copy && copy.ogImage
            ? { imageUrl: copy.ogImage, imageAlt: copy.title }
            : {}),
        },
        jsonLd: buildReportRuntimeGraph(),
      };
  }
}

/**
 * Inject canonical, OG, Twitter, and JSON-LD into `index.html` at build time.
 * Fetches `/v1/meta` once per build for version-aware landing/releases graphs.
 */
export function injectIndexSeoPlugin(options: { surface: SeoSurfaceKey }): VitePluginLike {
  let cachedHead: PageHeadOptions | null = null;

  async function ensureHead(): Promise<PageHeadOptions> {
    if (!cachedHead) {
      const snapshot = await fetchMetaSnapshotForBuild();
      cachedHead = await headForSurface(options.surface, snapshot);
    }
    return cachedHead;
  }

  return {
    name: 'i18nprune-seo-index',
    async buildStart() {
      await ensureHead();
    },
    async configureServer() {
      await ensureHead();
    },
    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        const head = await ensureHead();
        const tags = [renderFaviconHeadTags(), renderPageHeadTags(head)].join('\n    ');
        if (html.includes('<!-- i18nprune:seo -->')) {
          return html.replace('<!-- i18nprune:seo -->', tags);
        }
        return html.replace('</head>', `    ${tags}\n  </head>`);
      },
    },
  };
}
