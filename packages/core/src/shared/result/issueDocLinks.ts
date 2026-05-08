import type { Issue } from '../../types/json/envelope/index.js';
import { issueCodeDocHref, normalizeRepoDocPath } from '../docs/index.js';

export {
  type IssueCodeDocLinkParts,
  issueCodeDocHref,
  normalizeRepoDocPath,
  resolveIssueCodeDocLink,
} from '../docs/index.js';
export { DOCS_SITE_ORIGIN } from '../constants/docs.js';

/** Attach `docHref` for machine codes under `i18nprune.*` (idempotent). Normalizes **`docPath`** with {@link normalizeRepoDocPath}. */
export function enrichIssuesWithDocHrefs(issues: Issue[]): Issue[] {
  return issues.map((issue) => {
    const withPath =
      issue.docPath !== undefined
        ? { ...issue, docPath: normalizeRepoDocPath(issue.docPath) }
        : issue;
    if (!withPath.code.startsWith('i18nprune.')) return withPath;
    if (withPath.docHref !== undefined) return withPath;
    return { ...withPath, docHref: issueCodeDocHref(withPath.code) };
  });
}
