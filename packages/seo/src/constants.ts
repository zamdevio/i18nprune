/** Product display name. */
export const PRODUCT_NAME = 'i18nprune' as const;

/** Default CLI version when meta worker is unreachable at build time. */
export const FALLBACK_CLI_VERSION = '0.1.0' as const;

export const PRODUCT_TAGLINE =
  'The ESLint for production i18n. A compiler-grade localization infrastructure toolkit.' as const;

export const PRODUCT_DESCRIPTION =
  'Production-grade i18n toolkit. Detect drift, prune unused keys, validate locales, and automate localization maintenance in CI and on the edge.' as const;

export const GITHUB_OWNER = 'zamdevio' as const;
export const GITHUB_REPO = 'i18nprune' as const;
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}` as const;
export const LICENSE_URL = `${GITHUB_REPO_URL}/blob/main/LICENSE` as const;

export const NPM_PACKAGE_NAME = 'i18nprune' as const;
export const NPM_PACKAGE_URL = `https://www.npmjs.com/package/${NPM_PACKAGE_NAME}` as const;
export const NPM_INSTALL_COMMAND = `npm install ${NPM_PACKAGE_NAME}` as const;

export const LANDING_URL = 'https://i18nprune.dev' as const;
export const DOCS_URL = 'https://docs.i18nprune.dev' as const;
export const RELEASES_URL = 'https://releases.i18nprune.dev' as const;
export const WEB_APP_URL = 'https://web.i18nprune.dev' as const;
export const REPORT_URL = 'https://report.i18nprune.dev' as const;
export const GIT_URL = 'https://git.i18nprune.dev' as const;
export const WORKER_URL = 'https://worker.i18nprune.dev' as const;
export const META_WORKER_URL = 'https://meta.i18nprune.dev' as const;

/** Stable Schema.org @id for the canonical product entity. */
export const PRODUCT_SOFTWARE_ID = `${LANDING_URL}/#software` as const;

/** Stable Schema.org @id for the marketing WebSite. */
export const PRODUCT_WEBSITE_ID = `${LANDING_URL}/#website` as const;

/** Custom domains for Cloudflare default-host redirects. */
export const CANONICAL_HOSTS = {
  landing: 'i18nprune.dev',
  docs: 'docs.i18nprune.dev',
  web: 'web.i18nprune.dev',
  report: 'report.i18nprune.dev',
  releases: 'releases.i18nprune.dev',
  git: 'git.i18nprune.dev',
  worker: 'worker.i18nprune.dev',
  meta: 'meta.i18nprune.dev',
} as const;

export type CanonicalHostKey = keyof typeof CANONICAL_HOSTS;
