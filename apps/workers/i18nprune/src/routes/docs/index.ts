import type { Hono } from 'hono';
import { getDocsUrl } from '@i18nprune/core';
import { renderSwaggerShell } from '@i18nprune/ui/swagger';
import { openApiDocument } from '../../openapi';
import type { WorkerEnv } from '../types';

export function registerDocsRoutes(app: Hono<WorkerEnv>): void {
  app.get('/openapi.json', (c) => c.json(openApiDocument));
  app.get('/docs', (c) => {
    const origin = new URL(c.req.url).origin;
    return c.html(
      renderSwaggerShell({
        title: 'i18nprune Worker API',
        openApiUrl: `${origin}/openapi.json`,
        headerLinks: [
          { href: getDocsUrl(), label: 'Docs' },
          { href: getDocsUrl('commands/share'), label: 'Share command' },
        ],
      }),
    );
  });
}
