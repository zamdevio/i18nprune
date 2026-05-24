import { getSwaggerUiAssets } from './assets.js';
import { escapeHtml } from './escape.js';
import { swaggerOverridesCss } from './overrides-css.js';
import { SWAGGER_UI_DIST_VERSION } from './version.js';
import type { SwaggerShellOptions } from '../types/swagger/index.js';

export function renderSwaggerShell(options: SwaggerShellOptions): string {
  const version = options.swaggerUiVersion ?? SWAGGER_UI_DIST_VERSION;
  const assets = getSwaggerUiAssets(version);
  const css = options.overridesCss ?? swaggerOverridesCss;
  const links = options.headerLinks ?? [];

  const headerLinks = links
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`,
    )
    .join('');

  const headerNav =
    headerLinks.length > 0
      ? `<nav class="i18nprune-swagger-head__links" aria-label="Related links">${headerLinks}</nav>`
      : '';

  const stylesheetLinks = assets.css
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join('\n  ');

  const scriptTags = assets.js
    .map((src) => `<script src="${escapeHtml(src)}" crossorigin="anonymous"><\/script>`)
    .join('\n  ');

  const openApiUrl = JSON.stringify(options.openApiUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(options.title)}" />
    <title>${escapeHtml(options.title)}</title>
    ${stylesheetLinks}
    <style>${css}</style>
  </head>
  <body>
    <header class="i18nprune-swagger-head">
      <h1 class="i18nprune-swagger-head__title">${escapeHtml(options.title)}</h1>
      ${headerNav}
    </header>
    <main class="i18nprune-swagger-body">
      <div id="swagger-ui"></div>
    </main>
    ${scriptTags}
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          dom_id: '#swagger-ui',
          url: ${openApiUrl},
          deepLinking: true,
          persistAuthorization: true,
        });
      };
    <\/script>
  </body>
</html>`;
}
