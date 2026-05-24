export type SwaggerShellLink = {
  href: string;
  label: string;
  /** Opens in a new tab (default: true for absolute http(s) URLs). */
  external?: boolean;
};

export type SwaggerShellOptions = {
  title: string;
  openApiUrl: string;
  headerLinks?: readonly SwaggerShellLink[];
  /** Header brand title (default: i18nprune). */
  brandTitle?: string;
  /** Header brand subtitle (default: API). */
  brandSubtitle?: string;
  /** Logo URL for header brand cluster. */
  logoUrl?: string;
  /** Favicon URL for the docs page tab icon. */
  faviconUrl?: string;
  /** Request origin for swagger-ui + openapi URLs (e.g. from Hono `c.req.url`). */
  assetBaseUrl?: string;
  /** Path under public for swagger-ui files (default: `assets`). */
  assetPath?: string;
  /** Use jsDelivr CDN instead of host-owned `public/assets/` files. */
  useCdnAssets?: boolean;
  /** localStorage key for theme (default: web runtime key). */
  themeStorageKey?: string;
  /** Inline CSS overrides (defaults to bundled swagger overrides). */
  overridesCss?: string;
  /** Pinned swagger-ui-dist version for CDN assets. */
  swaggerUiVersion?: string;
  /** Hide the Servers selector (default: hidden — single-server workers). */
  showServersSection?: boolean;
};
