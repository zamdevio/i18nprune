import { getSwaggerUiAssets, getSwaggerUiCdnAssets } from './assets.js';
import { escapeHtml } from './escape.js';
import { swaggerOverridesCss } from './overrides-css.js';
import { renderSwaggerThemeScript, SWAGGER_THEME_STORAGE_KEY } from './theme-script.js';
import { SWAGGER_UI_DIST_VERSION } from './version.js';
import type { SwaggerShellLink, SwaggerShellOptions } from '../types/swagger/index.js';

const THEME_ICONS = {
  sun: `<svg class="i18nprune-swagger-theme-btn__icon i18nprune-swagger-theme-btn__icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  moon: `<svg class="i18nprune-swagger-theme-btn__icon i18nprune-swagger-theme-btn__icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
};

const EXTERNAL_LINK_ICON = `<svg class="i18nprune-swagger-head__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>`;

function renderHeaderLink(link: SwaggerShellLink): string {
  const isExternal = link.external ?? /^https?:\/\//.test(link.href);
  const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const icon = isExternal ? EXTERNAL_LINK_ICON : '';
  return `<a class="i18nprune-swagger-head__nav-link" href="${escapeHtml(link.href)}"${externalAttrs}>${escapeHtml(link.label)}${icon}</a>`;
}

export function renderSwaggerShell(options: SwaggerShellOptions): string {
  const version = options.swaggerUiVersion ?? SWAGGER_UI_DIST_VERSION;
  const assets = options.useCdnAssets
    ? getSwaggerUiCdnAssets(version)
    : getSwaggerUiAssets({
        baseUrl: options.assetBaseUrl,
        assetPath: options.assetPath,
      });
  const css = options.overridesCss ?? swaggerOverridesCss;
  const links = options.headerLinks ?? [];
  const brandTitle = options.brandTitle ?? 'i18nprune';
  const brandSubtitle = options.brandSubtitle ?? 'API';
  const logoUrl = options.logoUrl;
  const faviconUrl = options.faviconUrl;
  const themeStorageKey = options.themeStorageKey ?? SWAGGER_THEME_STORAGE_KEY;
  const themeScript = renderSwaggerThemeScript(themeStorageKey);

  const headerLinks = links.map(renderHeaderLink).join('');

  const faviconLink = faviconUrl
    ? `<link rel="icon" href="${escapeHtml(faviconUrl)}" sizes="any" />`
    : '';

  const logoImg = logoUrl
    ? `<img class="i18nprune-swagger-head__logo" src="${escapeHtml(logoUrl)}" alt="" width="32" height="32" aria-hidden="true" />`
    : '';

  const headerNav = `<nav class="i18nprune-swagger-head__nav" aria-label="Related links">
        <span class="i18nprune-swagger-head__nav-link is-active" aria-current="page">API</span>
        ${headerLinks}
      </nav>`;

  const stylesheetLinks = assets.css
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join('\n  ');

  const scriptTags = assets.js
    .map((src) => `<script src="${escapeHtml(src)}" crossorigin="anonymous"><\/script>`)
    .join('\n  ');

  const openApiUrl = JSON.stringify(options.openApiUrl);
  const hideServers = options.showServersSection !== true;
  const bodyClass = hideServers
    ? 'i18nprune-swagger i18nprune-swagger--hide-servers'
    : 'i18nprune-swagger';

  return `<!doctype html>
  <html lang="en" class="i18nprune-swagger-root">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(options.title)}" />
    <title>${escapeHtml(options.title)}</title>
    ${faviconLink}
    <script>${themeScript}<\/script>
    ${stylesheetLinks}
    <style>${css}</style>
  </head>
  <body class="${bodyClass}">
    <header class="i18nprune-swagger-head">
      <div class="i18nprune-swagger-head__inner">
        <div class="i18nprune-swagger-head__cluster">
          ${logoImg}
          <div class="i18nprune-swagger-head__brand">
            <span class="i18nprune-swagger-head__title">${escapeHtml(brandTitle)}</span>
            <span class="i18nprune-swagger-head__subtitle">${escapeHtml(brandSubtitle)}</span>
          </div>
        </div>
        ${headerNav}
        <div class="i18nprune-swagger-head__actions">
          <button
            type="button"
            id="i18nprune-swagger-theme-toggle"
            class="i18nprune-swagger-theme-btn"
            aria-label="Toggle light and dark theme"
          >
            ${THEME_ICONS.sun}
            ${THEME_ICONS.moon}
          </button>
        </div>
      </div>
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
          defaultModelsExpandDepth: 0,
          docExpansion: 'list',
        });
      };
    <\/script>
  </body>
</html>`;
}
