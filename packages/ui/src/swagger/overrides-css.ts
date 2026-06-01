/**
 * Bundled swagger-ui overrides (inlined for worker bundles).
 * Keep in sync with ../styles/swagger-overrides.css.
 * Regenerate: pnpm ui:sync:swagger-css
 */
export const swaggerOverridesCss = `/**
 * swagger-ui-dist overrides — i18nprune shell + dark-mode compat layer.
 * Light mode: leave swagger-ui-dist defaults for opblocks, schemas, curl, responses.
 * Pin SWAGGER_UI_DIST_VERSION when upgrading swagger-ui-dist.
 * Keep in sync with ../swagger/overrides-css.ts (inlined for worker bundles).
 */

:root {
  color-scheme: light;
  --i18n-swagger-head-h: 56px;
  --i18n-bg: hsl(170 20% 98%);
  --i18n-fg: hsl(170 40% 10%);
  --i18n-muted: hsl(170 10% 45%);
  --i18n-border: hsl(170 20% 88%);
  --i18n-panel: hsl(0 0% 100%);
  --i18n-panel-2: hsl(170 20% 96%);
  --i18n-primary: hsl(160 100% 35%);
}

html.dark {
  color-scheme: dark;
  --i18n-bg: hsl(170 30% 4%);
  --i18n-fg: hsl(170 10% 95%);
  --i18n-muted: hsl(170 15% 65%);
  --i18n-border: hsl(170 20% 12%);
  --i18n-panel: hsl(170 30% 6%);
  --i18n-panel-2: hsl(170 25% 10%);
  --i18n-primary: hsl(160 100% 45%);
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--i18n-bg);
  color: var(--i18n-fg);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
}

.i18nprune-swagger-head {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--i18n-swagger-head-h);
  border-bottom: 1px solid color-mix(in hsl, var(--i18n-border) 70%, transparent);
  background: color-mix(in hsl, var(--i18n-panel) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

html.dark .i18nprune-swagger-head {
  background: color-mix(in hsl, var(--i18n-panel) 85%, transparent);
}

html.i18nprune-swagger-root,
html.i18nprune-swagger-root body {
  overflow-x: hidden;
}

.swagger-ui {
  overflow-x: hidden;
  max-width: 100%;
}

.swagger-ui .wrapper {
  overflow-x: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.swagger-ui .information-container {
  max-width: calc(100% - 2.5rem);
  box-sizing: border-box;
  overflow-x: hidden;
}

.swagger-ui .info .title,
.swagger-ui .info .description,
.swagger-ui .info a,
.swagger-ui .info p,
.swagger-ui .info li {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.i18nprune-swagger-head__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  height: 100%;
  max-width: none;
  padding: 0 clamp(12px, 3vw, 40px);
  column-gap: 10px;
}

.i18nprune-swagger-head__cluster {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  justify-self: start;
}

.i18nprune-swagger-head__logo {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.i18nprune-swagger-head__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  min-width: 0;
}

.i18nprune-swagger-head__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--i18n-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(220px, 42vw);
}

.i18nprune-swagger-head__subtitle {
  font-size: 0.68rem;
  color: var(--i18n-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(220px, 42vw);
}

.i18nprune-swagger-head__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
  justify-self: center;
}

.i18nprune-swagger-head__nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--i18n-muted);
  font-size: 0.88rem;
  text-decoration: none;
  line-height: 1;
  white-space: nowrap;
}

.i18nprune-swagger-head__nav-link:hover {
  color: var(--i18n-fg);
  background: var(--i18n-panel-2);
}

.i18nprune-swagger-head__nav-link.is-active {
  color: var(--i18n-primary);
  border-color: color-mix(in hsl, var(--i18n-primary) 35%, transparent);
  background: color-mix(in hsl, var(--i18n-primary) 12%, transparent);
  font-weight: 600;
}

.i18nprune-swagger-head__nav-icon {
  width: 0.85rem;
  height: 0.85rem;
  flex-shrink: 0;
  opacity: 0.75;
}

.i18nprune-swagger-head__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-self: end;
}

.i18nprune-swagger-theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid color-mix(in hsl, var(--i18n-border) 80%, transparent);
  border-radius: 999px;
  background: color-mix(in hsl, var(--i18n-panel-2) 50%, transparent);
  color: var(--i18n-muted);
  cursor: pointer;
}

.i18nprune-swagger-theme-btn:hover {
  color: var(--i18n-fg);
  background: var(--i18n-panel-2);
}

.i18nprune-swagger-theme-btn:focus {
  outline: none;
}

.i18nprune-swagger-theme-btn:focus-visible {
  outline: 2px solid color-mix(in hsl, var(--i18n-fg) 35%, transparent);
  outline-offset: 2px;
}

.i18nprune-swagger-theme-btn__icon {
  display: none;
  width: 1rem;
  height: 1rem;
}

html:not(.dark) .i18nprune-swagger-theme-btn__icon--moon {
  display: block;
}

html.dark .i18nprune-swagger-theme-btn__icon--sun {
  display: block;
}

.i18nprune-swagger-body {
  padding: calc(var(--i18n-swagger-head-h) + 0.5rem) 0 2rem;
}

.i18nprune-swagger-head__menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid color-mix(in hsl, var(--i18n-border) 80%, transparent);
  border-radius: 999px;
  background: color-mix(in hsl, var(--i18n-panel-2) 50%, transparent);
  color: var(--i18n-muted);
  cursor: pointer;
}

.i18nprune-swagger-head__menu-btn:hover {
  color: var(--i18n-fg);
  background: var(--i18n-panel-2);
}

.i18nprune-swagger-head__menu-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.i18nprune-swagger-nav-sidebar__backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: color-mix(in hsl, hsl(170 30% 4%) 55%, transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.i18nprune-swagger-nav-sidebar__backdrop.is-open {
  opacity: 1;
  pointer-events: auto;
}

body.i18nprune-swagger-nav-open {
  overflow: hidden;
}

.i18nprune-swagger-nav-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 120;
  width: min(18rem, 88vw);
  height: 100%;
  max-height: 100dvh;
  overflow-y: auto;
  background: var(--i18n-panel);
  border-right: 1px solid var(--i18n-border);
  box-shadow: 8px 0 32px color-mix(in hsl, hsl(170 30% 4%) 25%, transparent);
  padding: 1rem 1rem 1.5rem;
  box-sizing: border-box;
  transform: translateX(-105%);
  transition: transform 0.22s ease;
}

.i18nprune-swagger-nav-sidebar.is-open {
  transform: translateX(0);
}

.i18nprune-swagger-nav-sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.i18nprune-swagger-nav-sidebar__title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--i18n-fg);
}

.i18nprune-swagger-nav-sidebar__close {
  width: 36px;
  height: 36px;
  border: 1px solid var(--i18n-border);
  border-radius: 10px;
  background: transparent;
  color: var(--i18n-fg);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.i18nprune-swagger-nav-sidebar__group-label {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--i18n-muted);
}

.i18nprune-swagger-nav-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.i18nprune-swagger-nav-sidebar__link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.45rem 0.55rem;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--i18n-muted);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  line-height: 1.3;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.i18nprune-swagger-nav-sidebar__link:hover {
  color: var(--i18n-fg);
  background: var(--i18n-panel-2);
}

.i18nprune-swagger-nav-sidebar__link.is-active {
  color: var(--i18n-primary);
  border-color: color-mix(in hsl, var(--i18n-primary) 35%, transparent);
  background: color-mix(in hsl, var(--i18n-primary) 12%, transparent);
  font-weight: 600;
}

@media (max-width: 769px) {
  .i18nprune-swagger-head__inner {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .i18nprune-swagger-head__menu-btn {
    display: inline-flex;
  }

  .i18nprune-swagger-head__nav--inline {
    display: none;
  }

  .i18nprune-swagger-head__actions {
    grid-column: 2;
    justify-self: end;
  }

  .i18nprune-swagger-head__title {
    max-width: min(160px, 42vw);
  }

  .swagger-ui .information-container {
    margin-left: 0.75rem;
    margin-right: 0.75rem;
    max-width: calc(100% - 1.5rem);
  }

  .swagger-ui .wrapper .opblock-tag-section {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

@media (min-width: 770px) {
  .i18nprune-swagger-nav-sidebar,
  .i18nprune-swagger-nav-sidebar__backdrop {
    display: none;
  }
}

@media (max-width: 520px) {
  .i18nprune-swagger-head__subtitle {
    display: none;
  }
}

@media (max-width: 480px) {
  .swagger-ui .info .title {
    font-size: 1.35rem;
    line-height: 1.25;
  }

  .swagger-ui .info a {
    display: inline-block;
    max-width: 100%;
    word-break: break-all;
  }

  .swagger-ui .opblock-summary-path {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .swagger-ui .opblock-summary-description {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .swagger-ui .opblock .opblock-summary {
    flex-wrap: wrap;
    gap: 4px;
  }

  .swagger-ui table {
    display: block;
    overflow-x: auto;
    max-width: 100%;
  }
}

.i18nprune-swagger--hide-servers .swagger-ui .scheme-container {
  display: none !important;
}

/* Thin scrollbars — docs-style (page + inner areas). */
html.i18nprune-swagger-root,
html.i18nprune-swagger-root body {
  scrollbar-color: color-mix(in hsl, var(--i18n-border) 85%, transparent) var(--i18n-bg);
  scrollbar-width: thin;
}

html.i18nprune-swagger-root::-webkit-scrollbar,
html.i18nprune-swagger-root body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

html.i18nprune-swagger-root::-webkit-scrollbar-track,
html.i18nprune-swagger-root body::-webkit-scrollbar-track {
  background: var(--i18n-bg);
}

html.i18nprune-swagger-root::-webkit-scrollbar-thumb,
html.i18nprune-swagger-root body::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: color-mix(in hsl, var(--i18n-border) 85%, transparent);
}

html.i18nprune-swagger-root::-webkit-scrollbar-thumb:hover,
html.i18nprune-swagger-root body::-webkit-scrollbar-thumb:hover {
  background: color-mix(in hsl, var(--i18n-muted) 55%, transparent);
}

.i18nprune-swagger,
.i18nprune-swagger * {
  scrollbar-color: color-mix(in hsl, var(--i18n-border) 85%, transparent) var(--i18n-bg);
  scrollbar-width: thin;
}

.i18nprune-swagger *::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.i18nprune-swagger *::-webkit-scrollbar-track {
  background: var(--i18n-bg);
}

.i18nprune-swagger *::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: color-mix(in hsl, var(--i18n-border) 85%, transparent);
}

.i18nprune-swagger *::-webkit-scrollbar-thumb:hover {
  background: color-mix(in hsl, var(--i18n-muted) 55%, transparent);
}

.swagger-ui .topbar {
  display: none;
}

.swagger-ui .wrapper {
  background: transparent;
}

.swagger-ui .information-container {
  background: var(--i18n-panel);
  box-shadow: none;
  border: 1px solid var(--i18n-border);
  border-radius: 12px;
  margin: 1rem 1.25rem 0;
  padding: 1rem 1.15rem;
}

.swagger-ui .info {
  margin: 0;
}

.swagger-ui .opblock .opblock-summary-control,
.swagger-ui .model-box-control,
.swagger-ui .models-control {
  outline: none !important;
  box-shadow: none !important;
}

.swagger-ui .opblock .opblock-summary-control:focus,
.swagger-ui .opblock .opblock-summary-control:focus-visible,
.swagger-ui .opblock .opblock-summary-control:active,
.swagger-ui .model-box-control:focus,
.swagger-ui .model-box-control:focus-visible,
.swagger-ui .models-control:focus,
.swagger-ui .models-control:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.swagger-ui .wrapper .opblock-tag-section {
  padding: 0 1.25rem;
}

/* ── Dark mode: same swagger color technique, readable on dark page bg ── */
html.dark .swagger-ui .information-container {
  background: var(--i18n-panel);
}

html.dark .swagger-ui .info .title {
  color: var(--i18n-fg);
}

html.dark .swagger-ui .info .description,
html.dark .swagger-ui .info li,
html.dark .swagger-ui .info p {
  color: var(--i18n-muted);
}

html.dark .swagger-ui .info a {
  color: var(--i18n-primary);
}

html.dark .swagger-ui .opblock-tag {
  color: var(--i18n-fg);
  border-bottom-color: rgba(255, 255, 255, 0.12);
}

html.dark .swagger-ui .opblock-tag small {
  color: var(--i18n-muted);
}

html.dark .swagger-ui .opblock.opblock-get {
  background: rgba(97, 175, 254, 0.1);
  border-color: #61affe;
}

html.dark .swagger-ui .opblock.opblock-get .opblock-summary-method {
  background: #61affe;
  color: #fff;
}

html.dark .swagger-ui .opblock.opblock-post {
  background: rgba(73, 204, 144, 0.1);
  border-color: #49cc90;
}

html.dark .swagger-ui .opblock.opblock-post .opblock-summary-method {
  background: #49cc90;
  color: #fff;
}

html.dark .swagger-ui .opblock.opblock-put {
  background: rgba(252, 161, 48, 0.1);
  border-color: #fca130;
}

html.dark .swagger-ui .opblock.opblock-put .opblock-summary-method {
  background: #fca130;
  color: #fff;
}

html.dark .swagger-ui .opblock.opblock-delete {
  background: rgba(249, 62, 62, 0.1);
  border-color: #f93e3e;
}

html.dark .swagger-ui .opblock.opblock-delete .opblock-summary-method {
  background: #f93e3e;
  color: #fff;
}

html.dark .swagger-ui .opblock.opblock-patch {
  background: rgba(80, 227, 194, 0.1);
  border-color: #50e3c2;
}

html.dark .swagger-ui .opblock.opblock-patch .opblock-summary-method {
  background: #50e3c2;
  color: #fff;
}

html.dark .swagger-ui .opblock .opblock-summary-path,
html.dark .swagger-ui .opblock .opblock-summary-description {
  color: #e8e8e8;
}

html.dark .swagger-ui .opblock .opblock-section-header {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

html.dark .swagger-ui .opblock .opblock-section-header h4,
html.dark .swagger-ui .opblock .opblock-section-header label {
  color: var(--i18n-fg);
}

html.dark .swagger-ui .opblock-body,
html.dark .swagger-ui .table-container,
html.dark .swagger-ui .parameters-container,
html.dark .swagger-ui .responses-wrapper {
  background: rgba(0, 0, 0, 0.15);
}

html.dark .swagger-ui .parameter__name,
html.dark .swagger-ui .parameter__type,
html.dark .swagger-ui .response-col_status,
html.dark .swagger-ui .response-col_description,
html.dark .swagger-ui table thead tr td,
html.dark .swagger-ui table thead tr th,
html.dark .swagger-ui table tbody tr td {
  color: var(--i18n-fg);
}

html.dark .swagger-ui .response-col_description__inner div {
  color: var(--i18n-muted);
}

html.dark .swagger-ui section.models {
  border-color: rgba(255, 255, 255, 0.15);
}

html.dark .swagger-ui section.models h4 {
  color: #b4b4b4;
}

html.dark .swagger-ui section.models h4:hover {
  background: rgba(255, 255, 255, 0.03);
}

html.dark .swagger-ui section.models.is-open h4 {
  border-bottom-color: rgba(255, 255, 255, 0.12);
}

html.dark .swagger-ui section.models .model-container {
  background: rgba(255, 255, 255, 0.05);
}

html.dark .swagger-ui section.models .model-container:hover {
  background: rgba(255, 255, 255, 0.07);
}

html.dark .swagger-ui .model-box {
  background: rgba(255, 255, 255, 0.08);
}

html.dark .swagger-ui .model-title,
html.dark .swagger-ui .model .prop-name,
html.dark .swagger-ui .model span {
  color: var(--i18n-fg);
}

html.dark .swagger-ui .model .prop-type,
html.dark .swagger-ui .model .prop-format {
  color: var(--i18n-muted);
}

html.dark .swagger-ui input[type='text'],
html.dark .swagger-ui input[type='password'],
html.dark .swagger-ui input[type='search'],
html.dark .swagger-ui input[type='email'],
html.dark .swagger-ui input[type='file'],
html.dark .swagger-ui textarea,
html.dark .swagger-ui select {
  background: var(--i18n-panel);
  color: var(--i18n-fg);
  border-color: var(--i18n-border);
}

html.dark .swagger-ui .btn {
  color: var(--i18n-fg);
  border-color: var(--i18n-border);
  background: var(--i18n-panel-2);
}

html.dark .swagger-ui .scheme-container {
  background: var(--i18n-panel);
  border-color: var(--i18n-border);
}
`.trim();
