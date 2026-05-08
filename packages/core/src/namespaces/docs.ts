/**
 * All published-docs URL helpers and repo doc-path normalizers, plus site/GitHub string constants.
 * The package re-exports this module as `import { docs } from 'i18nprune/core'` (namespace of these symbols).
 */
export * from '../shared/docs/index.js';
export {
  DOCS_ISSUES_PAGE_PATH,
  DOCS_SITE_ORIGIN,
  GITHUB_BASE,
  GITHUB_DOCS_BASE,
  GITHUB_DOCS_TREE_BASE,
} from '../shared/constants/docs.js';
export {
  DEMO_REPORT_URL,
  DOCS_SITE_BASE,
  GITHUB_API_URL,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_REPO_URL,
  LICENSE_URL,
  NPM_PACKAGE_NAME,
  NPM_PACKAGE_URL,
} from '../shared/constants/links.js';
