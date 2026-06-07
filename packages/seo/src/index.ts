export {
  CANONICAL_HOSTS,
  DOCS_URL,
  FALLBACK_CLI_VERSION,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_REPO_URL,
  LANDING_URL,
  LICENSE_URL,
  META_WORKER_URL,
  NPM_INSTALL_COMMAND,
  NPM_PACKAGE_NAME,
  NPM_PACKAGE_URL,
  PRODUCT_DESCRIPTION,
  PRODUCT_NAME,
  PRODUCT_SOFTWARE_ID,
  PRODUCT_TAGLINE,
  PRODUCT_WEBSITE_ID,
  RELEASES_URL,
  REPORT_URL,
  WEB_APP_URL,
  GIT_URL,
  WORKER_URL,
} from './constants.js';
export type { CanonicalHostKey } from './constants.js';

export {
  escapeHtmlAttribute,
  renderFaviconHeadTags,
  renderLinkTag,
  renderMetaTag,
  renderOpenGraphTags,
  renderPageHeadTags,
  renderTwitterTags,
  serializeJsonLd,
  serializeJsonLdScript,
} from './head.js';
export type { PageHeadOptions } from './head.js';

export {
  buildApiDocsWebPage,
  buildBreadcrumbList,
  buildLandingGraph,
  buildGitAnalyticsGraph,
  buildReleasesPortalGraph,
  buildReportRuntimeGraph,
  buildSoftwareApplication,
  buildTechArticle,
  buildWebApplication,
  buildWebRuntimeGraph,
  buildWebSite,
  mergeJsonLdGraphs,
} from './jsonld.js';

export {
  META_V1_URL,
  defaultProductMetaSnapshot,
  parseMetaV1ForSeo,
} from './meta.js';

export {
  cloudflareDefaultHostRedirect,
  cloudflareDefaultHostRedirectFor,
} from './redirect.js';
export type { CloudflareDefaultHostSuffix } from './redirect.js';

export { ROBOTS_PRESETS, renderRobotsTxt, renderRobotsTxtPreset } from './robots.js';
export type { RobotsTxtOptions } from './robots.js';

export type {
  BreadcrumbItem,
  JsonLdDocument,
  JsonLdGraphDocument,
  OpenGraphTags,
  ProductMetaSnapshot,
  TwitterCardTags,
} from './types.js';

export { SURFACE_COPY, DOCS_SITE_DESCRIPTION, PRODUCT_LONG_DESCRIPTION } from './surfaces.js';

export {
  BRAND_BACKGROUND_COLOR,
  BRAND_THEME_COLOR,
  buildSiteWebManifest,
} from './manifest.js';
export type { SiteWebManifest, WebManifestShortcut, WebManifestSurface } from './manifest.js';

export { fetchMetaSnapshotForBuild } from './build/fetchMeta.js';

export {
  INDEXNOW_DEFAULT_ENDPOINT,
  RELEASES_INDEXNOW_HOST,
  buildIndexNowPayload,
  buildReleasesIndexNowUrlList,
  indexNowKeyLocation,
  normalizeIndexNowHost,
  submitIndexNow,
} from './indexnow.js';
export type {
  SubmitIndexNowInput,
  SubmitIndexNowPayload,
  SubmitIndexNowResult,
} from './indexnow.js';
