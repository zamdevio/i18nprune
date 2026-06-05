import type { Hono } from 'hono';
import { buildApiDocsWebPage } from '@i18nprune/seo';
import { getDocsUrl } from '@i18nprune/core';
import { renderSwaggerShell } from '@i18nprune/ui/swagger';
import { openApiDocument } from '../../openapi';
import type { WorkerEnv } from '../types';

const DOCS_DESCRIPTION =
  'OpenAPI reference for i18nprune hosted project snapshots, validate/report reads, and share workflows on the edge.';

export function registerDocsRoutes(app: Hono<WorkerEnv>): void {
  app.get('/openapi.json', (c) => c.json(openApiDocument));
  app.get('/docs', (c) => {
    const origin = new URL(c.req.url).origin;
    const canonicalUrl = `${origin}/docs`;
    return c.html(
      renderSwaggerShell({
        title: 'i18nprune Worker API',
        metaDescription: DOCS_DESCRIPTION,
        brandSubtitle: 'Worker API',
        logoUrl: '/i18nprune.svg',
        openApiUrl: '/openapi.json',
        headerLinks: [
          { href: 'https://i18nprune.dev', label: 'Product' },
          { href: getDocsUrl(), label: 'Docs' },
          { href: getDocsUrl('commands/share'), label: 'Share command' },
        ],
        seo: {
          canonicalUrl,
          metaDescription: DOCS_DESCRIPTION,
          openGraph: {
            title: 'i18nprune Worker API',
            description: DOCS_DESCRIPTION,
            url: canonicalUrl,
            type: 'website',
          },
          jsonLd: buildApiDocsWebPage({
            name: 'i18nprune Worker API',
            url: canonicalUrl,
            description: DOCS_DESCRIPTION,
          }),
        },
      }),
    );
  });
}