import { SWAGGER_UI_DIST_VERSION } from './version.js';

export type SwaggerUiAssets = {
  css: string[];
  js: string[];
};

export function getSwaggerUiAssets(version: string = SWAGGER_UI_DIST_VERSION): SwaggerUiAssets {
  const base = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${version}`;
  return {
    css: [`${base}/swagger-ui.css`],
    js: [`${base}/swagger-ui-bundle.js`],
  };
}
