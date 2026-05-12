import { DOCS_SITE_BASE } from '../constants/links.js';
import { DOCS_ISSUES_PAGE_PATH } from '../constants/docs.js';

/** `i18nprune.<parent>.…` namespaces that map to `docs/issues/<parent>.md` (published `/issues/<parent>`). */
const DOC_ISSUE_PARENT_SEGMENTS = new Set([
  'cli',
  'cleanup',
  'config',
  'context',
  'doctor',
  'generate',
  'io',
  'languages',
  'locale',
  'locales',
  'missing',
  'patching',
  'quality',
  'report',
  'scan',
  'sync',
  'translate',
  'validate',
]);

/** VitePress-style slug for heading / URL fragments (lowercase, `_` and `.` → `-`). */
function issueDocHeadingSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function splitIssueCode(code: string): string[] {
  return code.trim().split('.');
}

/**
 * Resolved paths for docs links and envelopes.
 *
 * **Anchor:** known `i18nprune.<parent>.…` with a topic page → VitePress-style slug of the tail after `<parent>.`;
 * otherwise slug of the full code (dots folded for stability).
 */
export type IssueCodeDocLinkParts = {
  readonly parent: string | null;
  readonly anchor: string;
  /** Published site path with leading slash, e.g. `/issues/translate` or `/issues`. */
  readonly sitePagePath: string;
  /** Repo-relative fragment without `docs/` prefix, e.g. `issues/translate`. */
  readonly repoDocPath: string;
};

function buildIssueCodeDocLinkParts(code: string): IssueCodeDocLinkParts {
  const trimmed = code.trim();
  const parts = splitIssueCode(trimmed);

  let parent: string | null = null;
  if (parts.length >= 3 && parts[0] === 'i18nprune') {
    const p = parts[1]!;
    if (DOC_ISSUE_PARENT_SEGMENTS.has(p)) parent = p;
  }

  let anchor: string;
  if (parent) {
    anchor = issueDocHeadingSlug(parts.slice(2).join('.'));
  } else {
    anchor = issueDocHeadingSlug(trimmed.includes('.') ? trimmed.replace(/\./g, '_') : trimmed);
  }

  const sitePagePath = parent ? `${DOCS_ISSUES_PAGE_PATH}/${parent}` : DOCS_ISSUES_PAGE_PATH;
  const repoDocPath = parent ? `issues/${parent}` : 'issues';
  return { parent, anchor, sitePagePath, repoDocPath };
}

/**
 * Resolved docs link for an issue `code`: site path, repo `docPath` fragment, and URL hash slug.
 * Use {@link issueCodeDocHref} when you only need the full URL.
 */
export function resolveIssueCodeDocLink(code: string): IssueCodeDocLinkParts {
  return buildIssueCodeDocLinkParts(code);
}

/**
 * Repo-relative **`docPath`** fragment (no `docs/` prefix) for envelopes, e.g. `issues/translate`.
 * Falls back to `issues` when the parent has no topic file yet.
 */
export function issueCodeRepoDocPathForIssueCode(code: string): string {
  return buildIssueCodeDocLinkParts(code).repoDocPath;
}

/** Full docs site URL for this issue code (topic page + anchor). */
export function issueCodeDocHref(code: string): string {
  const { sitePagePath, anchor } = buildIssueCodeDocLinkParts(code);
  return `${DOCS_SITE_BASE}${sitePagePath}#${anchor}`;
}
