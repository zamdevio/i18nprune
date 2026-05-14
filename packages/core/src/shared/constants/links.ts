/** Canonical GitHub owner for this project. */
export const GITHUB_OWNER = 'zamdevio' as const;

/** Canonical GitHub repository name for this project. */
export const GITHUB_REPO = 'i18nprune' as const;

/** Canonical GitHub repository URL. */
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}` as const;

/** Canonical license URL in the repository. */
export const LICENSE_URL = `${GITHUB_REPO_URL}/blob/main/LICENSE` as const;

/** Canonical docs site base URL. Set to `""` to force GitHub docs URLs only. */
export const DOCS_SITE_BASE = 'https://docs.i18nprune.dev' as const;

/** GitHub metadata worker origin (Worker + custom domain). */
/** Public meta worker (GitHub + npm cached read models). */
export const META_WORKER_URL = 'https://meta.i18nprune.dev' as const;

/** Public report UI URL. */
export const DEMO_REPORT_URL = 'https://report.i18nprune.dev' as const;

/** Installable npm package name. */
export const NPM_PACKAGE_NAME = 'i18nprune' as const;

/** Public npm package page URL. */
export const NPM_PACKAGE_URL = `https://www.npmjs.com/package/${NPM_PACKAGE_NAME}` as const;
