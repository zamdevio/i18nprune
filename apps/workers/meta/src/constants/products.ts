/**
 * Product copy for discovery (`GET /`) and docs — not part of `/v1/meta` cache.
 * Keeps marketing / UX strings out of handler code.
 */
export const PRODUCT_SERVICE_SLUG = "i18nprune-meta";

export const ROOT_TAGLINE =
  "Cached GitHub, npm, and VS Code Marketplace facts for i18nprune CLIs, sites, and extensions.";

export const ROOT_DESCRIPTION =
  "Start at /v1/meta for the full JSON document, or open /docs to explore the contract interactively. " +
  "This API is versioned: only paths under /v1/ are stable for this generation; /v2/ will appear when we need a breaking contract.";

/** Integer API contract versions this deployment serves. */
export const SUPPORTED_API_VERSIONS = [1] as const;

export const API_VERSION_POLICY =
  "Each JSON body includes `version` (same meaning as the /v1 prefix). When we introduce incompatible changes, we will ship /v2/ and bump that field; clients should pin `version` or the URL prefix.";

export const ROOT_ENDPOINT_GUIDES: {
  path: string;
  method: string;
  summary: string;
  detail: string;
}[] = [
  {
    path: "/",
    method: "GET",
    summary: "Discovery",
    detail: "Human-oriented index: supported API versions, endpoint list with full URLs, quick-start curl, links to /docs and /openapi.json.",
  },
  {
    path: "/health",
    method: "GET",
    summary: "Probe (unversioned)",
    detail: "Minimal liveness for load balancers; not part of the /v1 contract.",
  },
  {
    path: "/v1/meta",
    method: "GET",
    summary: "Canonical snapshot",
    detail: "GitHub repo stats, npm cli+core rows, VS Code Marketplace extension row, links, and minimal cache hints. Best for CLIs and dashboards.",
  },
  {
    path: "/v1/github",
    method: "GET",
    summary: "GitHub only",
    detail: "Same `github` + `cache.github` shape as inside /v1/meta.",
  },
  {
    path: "/v1/npm",
    method: "GET",
    summary: "npm only",
    detail: "Same `npm` + `cache.npm` shape as inside /v1/meta (cli + core).",
  },
  {
    path: "/v1/extension",
    method: "GET",
    summary: "Marketplace extension only",
    detail: "Same `extension` + `cache.extension` shape as inside /v1/meta.",
  },
  {
    path: "/v1/health",
    method: "GET",
    summary: "Liveness",
    detail: "Cheap edge check; does not warm upstream caches.",
  },
  {
    path: "/openapi.json",
    method: "GET",
    summary: "OpenAPI 3.0",
    detail: "Machine-readable contract for codegen and CI drift checks.",
  },
  {
    path: "/docs",
    method: "GET",
    summary: "Swagger UI",
    detail: "Human-friendly explorer over /openapi.json.",
  },
];
