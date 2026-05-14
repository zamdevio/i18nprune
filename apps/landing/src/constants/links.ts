/**
 * Site URLs (`LINKS`), GitHub tree helper, and re-exports from `@i18nprune/core` (docs + site constants).
 */
import {
  DEMO_REPORT_URL,
  DOCS_SITE_BASE,
  GITHUB_REPO_URL,
  LICENSE_URL,
  META_WORKER_URL,
  NPM_PACKAGE_URL,
} from '@i18nprune/core';

export {
  DEMO_REPORT_URL,
  DOCS_ISSUES_PAGE_PATH,
  DOCS_SITE_BASE,
  DOCS_SITE_ORIGIN,
  GITHUB_BASE,
  GITHUB_DOCS_BASE,
  GITHUB_DOCS_TREE_BASE,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_REPO_URL,
  LICENSE_URL,
  META_WORKER_URL,
  NPM_PACKAGE_NAME,
  NPM_PACKAGE_URL,
  docsCommandUrl,
  getDocsUrl,
  type IssueCodeDocLinkParts,
  issueCodeDocHref,
  resolveIssueCodeDocLink,
} from '@i18nprune/core';

export const LINKS = {
  docs: DOCS_SITE_BASE,
  github: GITHUB_REPO_URL,
  meta: META_WORKER_URL,
  npm: NPM_PACKAGE_URL,
  license: LICENSE_URL,
  demoReport: DEMO_REPORT_URL,
} as const;

export function githubTree(repoPath: string): string {
  const p = repoPath.replace(/^\/+/, '');
  return `${LINKS.github}/tree/main/${p}`;
}
