import { DOCS_SITE_BASE, GITHUB_REPO_URL } from './links.js';

/** Same as `GITHUB_REPO_URL`; alias for docs/GitHub URL builders. */
export const GITHUB_BASE = GITHUB_REPO_URL;

export const GITHUB_DOCS_BASE = `${GITHUB_BASE}/blob/main/docs` as const;
export const GITHUB_DOCS_TREE_BASE = `${GITHUB_BASE}/tree/main/docs` as const;

/**
 * Public docs site origin (no trailing path). Aligned with {@link DOCS_SITE_BASE} in `links.ts`
 * (single source; kept for name clarity in link builders).
 */
export const DOCS_SITE_ORIGIN: typeof DOCS_SITE_BASE = DOCS_SITE_BASE;

/**
 * Path segment (leading slash) for the on-site **`issues[]`** reference (index + topic pages),
 * relative to {@link DOCS_SITE_BASE} (VitePress: `docs/issues/README.md` and `docs/issues/*.md`).
 */
export const DOCS_ISSUES_PAGE_PATH = '/issues' as const;
