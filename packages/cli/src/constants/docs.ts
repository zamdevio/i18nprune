// Docs site + GitHub URLs. Command name → docs slug: `utils/cli/docsSlug.ts` (avoids pulling Commander into consumers).
import {
  DOCS_SITE_BASE,
  GITHUB_REPO_URL,
} from "./links.js";

export const GITHUB_BASE = GITHUB_REPO_URL;
export const GITHUB_DOCS_BASE = `${GITHUB_BASE}/blob/main/docs`;
export const GITHUB_DOCS_TREE_BASE = `${GITHUB_BASE}/tree/main/docs`;

/**
 * Normalizes a repo-style docs path for URL building: trims slashes, strips a **file** `.md`
 * suffix, and collapses an explicit **`/README` index** segment so callers can pass either
 * `foo/bar`, `foo/bar.md`, or `foo/bar/README` interchangeably. Fragments (`#anchor`) are preserved.
 *
 * {@link getDocsUrl} may **re-append** `/README` for published Nextra folder-index URLs — see
 * {@link appendNextraReadmeIndexIfNeeded}.
 */
export function normalizeNextraPublicPath(input: string): string {
  const hashIdx = input.indexOf('#');
  const hash = hashIdx >= 0 ? input.slice(hashIdx) : '';
  let p = (hashIdx >= 0 ? input.slice(0, hashIdx) : input).trim().replace(/^\/+/, '');
  if (p.endsWith('.md')) p = p.slice(0, -3);
  if (p === 'README' || p.endsWith('/README')) {
    p = p === 'README' ? '' : p.slice(0, -'/README'.length);
  }
  return p + hash;
}

function parseDocsSitePath(input: string): { core: string; hash: string; hadTrailingReadme: boolean } {
  const hashIdx = input.indexOf('#');
  const hash = hashIdx >= 0 ? input.slice(hashIdx) : '';
  let p = (hashIdx >= 0 ? input.slice(0, hashIdx) : input).trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
  if (p.endsWith('.md')) p = p.slice(0, -3);
  let hadTrailingReadme = false;
  if (p === 'README') {
    hadTrailingReadme = true;
    p = '';
  } else if (p.endsWith('/README')) {
    hadTrailingReadme = true;
    p = p.slice(0, -'/README'.length);
  }
  return { core: p, hash, hadTrailingReadme };
}

/** Logical path under `docs/` → GitHub `blob/main/docs/…`. */
export function githubDocsUrl(filePath: string = 'README.md'): string {
  const n = normalizeNextraPublicPath(filePath);
  const hashIdx = n.indexOf('#');
  const hash = hashIdx >= 0 ? n.slice(hashIdx) : '';
  const p = hashIdx >= 0 ? n.slice(0, hashIdx) : n;

  if (p === '') {
    return `${GITHUB_DOCS_BASE}/README.md${hash}`;
  }

  const segments = p.split('/');
  const last = segments[segments.length - 1]!;

  if (last.includes('.')) {
    return `${GITHUB_DOCS_BASE}/${p}.md${hash}`;
  }
  if (last.includes('-')) {
    return `${GITHUB_DOCS_BASE}/${p}.md${hash}`;
  }
  return `${GITHUB_DOCS_BASE}/${p}/README.md${hash}`;
}

/** With site: `…/commands/{slug}/README`. Without site: GitHub `README.md` for that path. */
export function docsCommandUrl(command: string): string {
  const slug = command.trim().toLowerCase();
  if (!DOCS_SITE_BASE) {
    return `${GITHUB_DOCS_BASE}/commands/${slug}/README.md`;
  }
  return `${DOCS_SITE_BASE}/commands/${slug}/README`;
}

/** Options for {@link getDocsUrl} (published Nextra site only). */
export type GetDocsUrlOptions = {
  /** Omit `/README` and use the folder path only (trailing `README` / `.md` already stripped). */
  noReadme?: boolean;
};

const SITE_LEAF_PATHS = new Set<string>([
  'exports/core',
  'exports/config',
  'exports/examples',
  'json/programmatic',
]);

/** Single-segment sections whose live site URL is `/name` without a trailing `/README` (Nextra index route). */
const SITE_SINGLE_SEGMENT_CLEAN_URL = new Set<string>(['json']);

/**
 * Single-segment folders whose index is published at `/name/README` (explicit folder index on the docs site).
 */
const SITE_SINGLE_SEGMENT_README_INDEX = new Set<string>(['dynamic', 'cursor', 'origin', 'edge-cases']);

/** Whether the published site URL for this folder path ends with `/README`. */
export function appendNextraReadmeIndexIfNeeded(core: string): boolean {
  if (!core) return false;
  if (core.startsWith('commands/')) return true;
  if (!core.includes('/')) {
    if (SITE_SINGLE_SEGMENT_CLEAN_URL.has(core)) return false;
    if (SITE_SINGLE_SEGMENT_README_INDEX.has(core)) return true;
    return false;
  }
  if (SITE_LEAF_PATHS.has(core)) return false;
  return !core.slice(core.lastIndexOf('/') + 1).includes('-');
}

/**
 * Published site URL under {@link DOCS_SITE_BASE}. When `DOCS_SITE_BASE` is empty, falls back to
 * {@link githubDocsUrl}. Normalizes slashes and `.md`, strips a trailing `/README` to obtain `core`.
 * If the input explicitly ended with `/README`, the site URL is `core` or `core/README` depending on
 * {@link SITE_SINGLE_SEGMENT_CLEAN_URL} (e.g. `json/README` → `/json`); otherwise {@link appendNextraReadmeIndexIfNeeded}
 * applies. Pass `{ noReadme: true }` to use `core` only.
 */
export function getDocsUrl(path: string = '', options?: GetDocsUrlOptions): string {
  if (!DOCS_SITE_BASE) {
    return githubDocsUrl(path || 'README.md');
  }
  const { core, hash, hadTrailingReadme } = parseDocsSitePath(path);
  if (!core) return `${DOCS_SITE_BASE}${hash}`;
  if (options?.noReadme) {
    return `${DOCS_SITE_BASE}/${core}${hash}`;
  }
  let site: string;
  if (hadTrailingReadme) {
    if (SITE_SINGLE_SEGMENT_CLEAN_URL.has(core) || SITE_LEAF_PATHS.has(core)) {
      site = core;
    } else {
      site = `${core}/README`;
    }
  } else {
    site = appendNextraReadmeIndexIfNeeded(core) ? `${core}/README` : core;
  }
  return `${DOCS_SITE_BASE}/${site}${hash}`;
}
