import { SWAGGER_UI_DIST_VERSION } from './version.js';

export type SwaggerUiAssets = {
  css: string[];
  js: string[];
};

export type SwaggerUiAssetsOptions = {
  /** Base URL for swagger-ui files (no trailing slash). Omit for root-relative paths. */
  baseUrl?: string;
  /** Path segment under base (default: `assets` — worker `public/assets/`). */
  assetPath?: string;
  /** Pinned swagger-ui-dist version — CDN fallback only. */
  version?: string;
};

const SWAGGER_UI_CSS = 'swagger-ui.css';
const SWAGGER_UI_JS = 'swagger-ui-bundle.js';
const DEFAULT_ASSET_PATH = 'assets';

function joinAssetBase(baseUrl: string | undefined, assetPath: string, file: string): string {
  const segment = `${assetPath.replace(/^\/+|\/+$/g, '')}/${file}`;
  if (!baseUrl) return `/${segment}`;
  const trimmed = baseUrl.replace(/\/$/, '');
  return `${trimmed}/${segment}`;
}

/** Host-owned static files (e.g. worker `public/assets/`). Pass `baseUrl` for absolute URLs from request origin. */
export function getSwaggerUiAssets(options: SwaggerUiAssetsOptions = {}): SwaggerUiAssets {
  const assetPath = options.assetPath ?? DEFAULT_ASSET_PATH;
  const { baseUrl } = options;
  return {
    css: [joinAssetBase(baseUrl, assetPath, SWAGGER_UI_CSS)],
    js: [joinAssetBase(baseUrl, assetPath, SWAGGER_UI_JS)],
  };
}

/** CDN fallback when the host does not serve swagger-ui-dist locally. */
export function getSwaggerUiCdnAssets(version: string = SWAGGER_UI_DIST_VERSION): SwaggerUiAssets {
  const base = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${version}`;
  return {
    css: [`${base}/${SWAGGER_UI_CSS}`],
    js: [`${base}/${SWAGGER_UI_JS}`],
  };
}