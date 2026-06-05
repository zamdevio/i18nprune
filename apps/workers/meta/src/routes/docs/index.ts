import type { Hono } from 'hono';
import { buildApiDocsWebPage } from '@i18nprune/seo';
import { getDocsUrl } from '@i18nprune/core';
import { renderSwaggerShell } from '@i18nprune/ui/swagger';

type Env = {
  Bindings: {
    META_CACHE: DurableObjectNamespace;
  };
};

const DOCS_DESCRIPTION =
  'OpenAPI reference for cached GitHub, npm, and VS Code Marketplace metadata served by the i18nprune meta worker.';

export function registerDocsRoutes(app: Hono<Env>): void {
  app.get('/docs', (c) => {
    const origin = new URL(c.req.url).origin;
    const canonicalUrl = `${origin}/docs`;
    return c.html(
      renderSwaggerShell({
        title: 'i18nprune Meta API',
        metaDescription: DOCS_DESCRIPTION,
        brandSubtitle: 'Meta API',
        logoUrl: '/i18nprune.svg',
        openApiUrl: '/openapi.json',
        headerLinks: [
          { href: 'https://i18nprune.dev', label: 'Product' },
          { href: getDocsUrl(), label: 'Docs' },
          { href: 'https://worker.i18nprune.dev/docs', label: 'Worker API' },
        ],
        seo: {
          canonicalUrl,
          metaDescription: DOCS_DESCRIPTION,
          openGraph: {
            title: 'i18nprune Meta API',
            description: DOCS_DESCRIPTION,
            url: canonicalUrl,
            type: 'website',
          },
          jsonLd: buildApiDocsWebPage({
            name: 'i18nprune Meta API',
            url: canonicalUrl,
            description: DOCS_DESCRIPTION,
          }),
        },
      }),
    );
  });
}
