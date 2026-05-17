import {
  API_VERSION_POLICY,
  PRODUCT_SERVICE_SLUG,
  ROOT_DESCRIPTION,
  ROOT_ENDPOINT_GUIDES,
  ROOT_TAGLINE,
  SUPPORTED_API_VERSIONS,
} from "../constants/products";

export function buildRootCatalog(origin: string) {
  const o = origin.replace(/\/$/, "");
  return {
    ok: true,
    service: PRODUCT_SERVICE_SLUG,
    tagline: ROOT_TAGLINE,
    description: ROOT_DESCRIPTION,
    api: {
      currentVersion: 1,
      supportedVersions: [...SUPPORTED_API_VERSIONS],
      future: "When a breaking contract ships, it will live under /v2/ with `version: 2` in JSON bodies.",
      policy: API_VERSION_POLICY,
      canonicalMetaUrl: `${o}/v1/meta`,
    },
    explore: {
      documentationUrl: `${o}/docs`,
      openApiUrl: `${o}/openapi.json`,
    },
    quickStart: {
      curl: `curl -sSf "${o}/v1/meta"`,
      hint: "Use `jq` for fields like `.github.stars`, `.npm.cli.version`, `.extension.version`.",
    },
    endpoints: ROOT_ENDPOINT_GUIDES.map((e) => ({
      ...e,
      url: `${o}${e.path}`,
    })),
  };
}
