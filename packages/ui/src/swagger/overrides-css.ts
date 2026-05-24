/**
 * Bundled swagger-ui overrides (inlined for worker bundles).
 * Keep in sync with ../styles/swagger-overrides.css.
 */
export const swaggerOverridesCss = `
:root {
  color-scheme: light dark;
  --i18n-swagger-bg: #f8fafc;
  --i18n-swagger-fg: #0f172a;
  --i18n-swagger-muted: #64748b;
  --i18n-swagger-border: #e2e8f0;
  --i18n-swagger-accent: #2563eb;
  --i18n-swagger-head-bg: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --i18n-swagger-bg: #0b1220;
    --i18n-swagger-fg: #f1f5f9;
    --i18n-swagger-muted: #94a3b8;
    --i18n-swagger-border: #1e293b;
    --i18n-swagger-accent: #3b82f6;
    --i18n-swagger-head-bg: #111827;
  }
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--i18n-swagger-bg);
  color: var(--i18n-swagger-fg);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
}

.i18nprune-swagger-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--i18n-swagger-border);
  background: var(--i18n-swagger-head-bg);
}

.i18nprune-swagger-head__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
}

.i18nprune-swagger-head__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 0.85rem;
  font-size: 0.88rem;
}

.i18nprune-swagger-head__links a {
  color: var(--i18n-swagger-accent);
  text-decoration: none;
}

.i18nprune-swagger-head__links a:hover {
  text-decoration: underline;
}

.i18nprune-swagger-body {
  padding: 0 0 2rem;
}

.swagger-ui .topbar {
  display: none;
}

.swagger-ui .info .title {
  color: var(--i18n-swagger-fg);
}

.swagger-ui .info p,
.swagger-ui .info li,
.swagger-ui .info table,
.swagger-ui .response-col_status,
.swagger-ui table thead tr td,
.swagger-ui table thead tr th,
.swagger-ui .parameter__name,
.swagger-ui .parameter__type,
.swagger-ui .model-title,
.swagger-ui section.models h4,
.swagger-ui .opblock-tag {
  color: var(--i18n-swagger-fg);
}

.swagger-ui .info .title small.version-stamp {
  background: color-mix(in srgb, var(--i18n-swagger-accent) 16%, transparent);
  color: var(--i18n-swagger-accent);
}

.swagger-ui .opblock.opblock-get {
  border-color: color-mix(in srgb, var(--i18n-swagger-accent) 45%, var(--i18n-swagger-border));
  background: color-mix(in srgb, var(--i18n-swagger-accent) 8%, transparent);
}

.swagger-ui .opblock.opblock-post {
  border-color: color-mix(in srgb, #059669 45%, var(--i18n-swagger-border));
  background: color-mix(in srgb, #059669 8%, transparent);
}

.swagger-ui .opblock.opblock-delete {
  border-color: color-mix(in srgb, #dc2626 45%, var(--i18n-swagger-border));
  background: color-mix(in srgb, #dc2626 8%, transparent);
}

.swagger-ui .btn {
  border-radius: 8px;
}

.swagger-ui .btn.execute {
  background: var(--i18n-swagger-accent);
  border-color: var(--i18n-swagger-accent);
}

.swagger-ui .scheme-container {
  background: var(--i18n-swagger-head-bg);
  box-shadow: none;
  border-bottom: 1px solid var(--i18n-swagger-border);
}
`.trim();
