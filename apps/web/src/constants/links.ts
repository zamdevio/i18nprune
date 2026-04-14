/**
 * Site URLs (`LINKS`), GitHub tree helper, and re-exports: CLI docs constants (`./docs`), URL helpers (`../lib/docs`).
 */
import { DOCS_SITE_BASE } from "./docs";
import {
  DEMO_REPORT_URL,
  GITHUB_API_URL,
  GITHUB_REPO_URL,
  LICENSE_URL,
  NPM_PACKAGE_URL,
} from "../../../../packages/cli/src/constants/links";

export type { GetDocsUrlOptions } from "./docs";
export {
  DOCS_JSON_REPORT_VS_CLI_ANCHOR,
  DOCS_SITE_BASE,
  appendNextraReadmeIndexIfNeeded,
  docsCommandUrl,
  getDocsUrl,
  normalizeNextraPublicPath,
} from "./docs";

export const LINKS = {
  docs: DOCS_SITE_BASE,
  github: GITHUB_REPO_URL,
  githubApi: GITHUB_API_URL,
  npm: NPM_PACKAGE_URL,
  license: LICENSE_URL,
  demoReport: DEMO_REPORT_URL,
} as const;

export function githubTree(repoPath: string): string {
  const p = repoPath.replace(/^\/+/, "");
  return `${LINKS.github}/tree/main/${p}`;
}

export { docsJsonReportVsCliUrl, docsUrl } from "../lib/docs";
