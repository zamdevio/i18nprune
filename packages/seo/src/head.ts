import { BRAND_THEME_COLOR } from './manifest.js';
import type { JsonLdDocument, JsonLdGraphDocument, OpenGraphTags, TwitterCardTags } from './types.js';

export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderMetaTag(name: string, content: string): string {
  return `<meta name="${escapeHtmlAttribute(name)}" content="${escapeHtmlAttribute(content)}" />`;
}

export function renderLinkTag(
  rel: string,
  href: string,
  extra?: Record<string, string>,
): string {
  const attrs = Object.entries(extra ?? {})
    .map(([key, value]) => ` ${key}="${escapeHtmlAttribute(value)}"`)
    .join('');
  return `<link rel="${escapeHtmlAttribute(rel)}" href="${escapeHtmlAttribute(href)}"${attrs} />`;
}

export function renderOpenGraphTags(tags: OpenGraphTags): string {
  const lines = [
    `<meta property="og:title" content="${escapeHtmlAttribute(tags.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttribute(tags.description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttribute(tags.url)}" />`,
    `<meta property="og:type" content="${escapeHtmlAttribute(tags.type ?? 'website')}" />`,
  ];
  if (tags.siteName) {
    lines.push(
      `<meta property="og:site_name" content="${escapeHtmlAttribute(tags.siteName)}" />`,
    );
  }
  if (tags.imageUrl) {
    lines.push(`<meta property="og:image" content="${escapeHtmlAttribute(tags.imageUrl)}" />`);
  }
  if (tags.imageAlt) {
    lines.push(
      `<meta property="og:image:alt" content="${escapeHtmlAttribute(tags.imageAlt)}" />`,
    );
  }
  return lines.join('\n    ');
}

export function renderTwitterTags(tags: TwitterCardTags): string {
  const card = tags.card ?? (tags.imageUrl ? 'summary_large_image' : 'summary');
  const lines = [
    `<meta name="twitter:card" content="${escapeHtmlAttribute(card)}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttribute(tags.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttribute(tags.description)}" />`,
  ];
  if (tags.site) {
    lines.push(`<meta name="twitter:site" content="${escapeHtmlAttribute(tags.site)}" />`);
  }
  if (tags.imageUrl) {
    lines.push(`<meta name="twitter:image" content="${escapeHtmlAttribute(tags.imageUrl)}" />`);
  }
  if (tags.imageAlt) {
    lines.push(
      `<meta name="twitter:image:alt" content="${escapeHtmlAttribute(tags.imageAlt)}" />`,
    );
  }
  return lines.join('\n    ');
}

export function serializeJsonLd(document: JsonLdDocument | JsonLdGraphDocument): string {
  return JSON.stringify(document).replace(/</g, '\\u003c');
}

export function serializeJsonLdScript(document: JsonLdDocument | JsonLdGraphDocument): string {
  return `<script type="application/ld+json">${serializeJsonLd(document)}</script>`;
}

export type PageHeadOptions = {
  title: string;
  description: string;
  canonicalUrl: string;
  robots?: string;
  openGraph?: OpenGraphTags;
  twitter?: TwitterCardTags;
  jsonLd?: JsonLdDocument | JsonLdGraphDocument;
};

/** Standard favicon + PWA manifest link tags (paths are site-root relative). */
export function renderFaviconHeadTags(): string {
  return [
    renderLinkTag('icon', '/favicon.ico', { sizes: 'any' }),
    renderLinkTag('icon', '/favicon-32x32.png', { type: 'image/png', sizes: '32x32' }),
    renderLinkTag('icon', '/favicon-16x16.png', { type: 'image/png', sizes: '16x16' }),
    renderLinkTag('apple-touch-icon', '/apple-touch-icon.png'),
    renderLinkTag('manifest', '/site.webmanifest'),
    renderMetaTag('theme-color', BRAND_THEME_COLOR),
  ].join('\n    ');
}

/** HTML fragment for standard SEO head tags (no outer `<head>`). */
export function renderPageHeadTags(options: PageHeadOptions): string {
  const parts = [
    renderLinkTag('canonical', options.canonicalUrl),
    renderMetaTag('description', options.description),
    options.robots ? renderMetaTag('robots', options.robots) : '',
    options.openGraph ? renderOpenGraphTags(options.openGraph) : '',
    options.twitter ? renderTwitterTags(options.twitter) : '',
    options.jsonLd ? serializeJsonLdScript(options.jsonLd) : '',
  ].filter(Boolean);
  return parts.join('\n    ');
}
