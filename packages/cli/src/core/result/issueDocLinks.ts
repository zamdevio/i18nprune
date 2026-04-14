import type { Issue } from '@/types/core/json/envelope.js';

/** Public docs site origin for deep links (issue codes registry). */
export const DOCS_SITE_ORIGIN = 'https://docs.i18nprune.dev' as const;

/**
 * Normalize legacy `docPath` values to repo-root form under **`docs/`** so integrators see a clear tree path
 * (e.g. `commands/validate/README` → `docs/commands/validate/README`).
 */
export function normalizeRepoDocPath(docPath: string): string {
  const t = docPath.trim();
  if (t === '') return t;
  if (t.startsWith('docs/')) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `docs/${t}`;
}

/** Public URL path on docs.i18nprune.dev (no leading slash). Maps `docs/foo/bar` → `foo/bar`. */
export function docsSitePathFromRepoDocPath(repoDocPath: string): string {
  return repoDocPath.startsWith('docs/') ? repoDocPath.slice('docs/'.length) : repoDocPath;
}

const ISSUE_CODES_PAGE = '/json/issue-codes' as const;

/**
 * Stable URL fragment for an issue `code` (dots → hyphens), e.g.
 * `i18nprune.context.discovery_warning` → `i18nprune-context-discovery_warning`.
 */
export function issueCodeToAnchorFragment(code: string): string {
  return code.replace(/\./g, '-');
}

/** Full docs URL to the section for this issue code on the issue-codes page. */
export function issueCodeDocHref(code: string): string {
  return `${DOCS_SITE_ORIGIN}${ISSUE_CODES_PAGE}#${issueCodeToAnchorFragment(code)}`;
}

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
