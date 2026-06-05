import {
  buildTechArticle,
  DOCS_URL,
  serializeJsonLd,
  SURFACE_COPY,
} from '@i18nprune/seo';
import type { HeadConfig } from 'vitepress';

type DocsPageData = {
  title?: string;
  description?: string;
  relativePath: string;
};

function docsPageUrl(relativePath: string): string {
  const slug = relativePath
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '')
    .replace(/\/+$/, '');
  const path = slug.length > 0 ? `/${slug}/` : '/';
  return `${DOCS_URL}${path === '//' ? '/' : path}`;
}

/** Per-page Open Graph + JSON-LD for VitePress. */
export function transformDocsHead(ctx: { pageData: DocsPageData }): HeadConfig[] {
  const { pageData } = ctx;
  const headline = pageData.title ? `${pageData.title} | i18nprune` : SURFACE_COPY.docs.title;
  const description = pageData.description ?? SURFACE_COPY.docs.description;
  const url = docsPageUrl(pageData.relativePath);
  const jsonLd = buildTechArticle({ headline, description, url });

  return [
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:title', content: headline }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:type', content: 'article' }],
    ['meta', { property: 'og:site_name', content: 'i18nprune Docs' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: headline }],
    ['meta', { name: 'twitter:description', content: description }],
    ['script', { type: 'application/ld+json' }, serializeJsonLd(jsonLd)],
  ];
}
