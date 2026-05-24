import type { Hono } from 'hono';
import { getDocsUrl } from '@i18nprune/core';
import { renderSwaggerShell } from '@i18nprune/ui/swagger';
import { openApiDocument } from '../../openapi';
import type { WorkerEnv } from '../types';

export function registerDocsRoutes(app: Hono<WorkerEnv>): void {
  app.get('/openapi.json', (c) => c.json(openApiDocument));
  app.get('/docs', (c) =>
    c.html(
      renderSwaggerShell({
        title: 'i18nprune Worker API',
        brandSubtitle: 'Worker API',
        logoUrl: '/i18nprune.svg',
        faviconUrl: '/favicon.ico',
        openApiUrl: '/openapi.json', // ← relative, always same host as /docs
        headerLinks: [
          { href: 'https://i18nprune.dev', label: 'Product' },
          { href: getDocsUrl(), label: 'Docs' },
          { href: getDocsUrl('commands/share'), label: 'Share command' },
        ],
      }),
    ),
  );
}