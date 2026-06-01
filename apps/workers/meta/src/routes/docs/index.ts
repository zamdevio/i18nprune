import type { Hono } from 'hono';
import { getDocsUrl } from '@i18nprune/core';
import { renderSwaggerShell } from '@i18nprune/ui/swagger';

type Env = {
  Bindings: {
    META_CACHE: DurableObjectNamespace;
  };
};

export function registerDocsRoutes(app: Hono<Env>): void {
  app.get('/docs', (c) =>
    c.html(
      renderSwaggerShell({
        title: 'i18nprune Meta API',
        brandSubtitle: 'Meta API',
        logoUrl: '/i18nprune.svg',
        faviconUrl: '/favicon.ico',
        openApiUrl: '/openapi.json',
        headerLinks: [
          { href: 'https://i18nprune.dev', label: 'Product' },
          { href: getDocsUrl(), label: 'Docs' },
          { href: 'https://worker.i18nprune.dev/docs', label: 'Worker API' },
        ],
      }),
    ),
  );
}
