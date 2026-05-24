export type SwaggerShellLink = {
  href: string;
  label: string;
};

export type SwaggerShellOptions = {
  title: string;
  openApiUrl: string;
  headerLinks?: readonly SwaggerShellLink[];
  /** Inline CSS overrides (defaults to bundled swagger overrides). */
  overridesCss?: string;
  /** Pinned swagger-ui-dist version for CDN assets. */
  swaggerUiVersion?: string;
};
