import { DOCS_SITE_BASE } from '../constants/links.js';
import { GITHUB_DOCS_BASE } from '../constants/docs.js';

/**
 * Trims a repo-style docs path for URL building: strips `/README` index, `.md` / `.mdx`, trailing
 * slashes; preserves `#…`. Used for both the public site and GitHub blob URLs.
 */
function parseDocsLinkInput(input: string): { core: string; hash: string } {
  const hashIdx = input.indexOf('#');
  const hash = hashIdx >= 0 ? input.slice(hashIdx) : '';
  let p = (hashIdx >= 0 ? input.slice(0, hashIdx) : input).trim().replace(/^\/+/, '');
  p = p.replace(/\/+$/g, '');
  if (p.endsWith('.md')) p = p.slice(0, -3);
  if (p.endsWith('.mdx')) p = p.slice(0, -4);
  if (p === 'README' || p.endsWith('/README')) {
    p = p === 'README' ? '' : p.slice(0, -'/README'.length);
  }
  p = p.replace(/\/+$/g, '');
  p = p.replace(/\/+/g, '/');
  return { core: p, hash };
}

function githubDocsUrl(filePath: string = 'README.md'): string {
  const { core, hash } = parseDocsLinkInput(filePath);
  if (core === '') {
    return `${GITHUB_DOCS_BASE}/README.md${hash}`;
  }

  const segments = core.split('/');
  const last = segments[segments.length - 1]!;

  if (last.includes('.') || last.includes('-')) {
    return `${GITHUB_DOCS_BASE}/${core}.md${hash}`;
  }
  return `${GITHUB_DOCS_BASE}/${core}/README.md${hash}`;
}

/** With site: `…/commands/{slug}` (no `/README`). Without site: GitHub `…/README.md` for that path. */
export function docsCommandUrl(command: string): string {
  const slug = command.trim().toLowerCase();
  if (!DOCS_SITE_BASE) {
    return `${GITHUB_DOCS_BASE}/commands/${slug}/README.md`;
  }
  return `${DOCS_SITE_BASE}/commands/${slug}`;
}

/**
 * Published site URL under {@link DOCS_SITE_BASE}. When `DOCS_SITE_BASE` is empty, falls back to
 * GitHub blob URLs. Normalizes `.md` / `README` / trailing slashes; hash fragments are preserved.
 */
export function getDocsUrl(path: string = ''): string {
  if (!DOCS_SITE_BASE) {
    return githubDocsUrl(path || 'README.md');
  }
  const { core, hash } = parseDocsLinkInput(path);
  if (!core) {
    return `${DOCS_SITE_BASE}${hash}`;
  }
  return `${DOCS_SITE_BASE}/${core}${hash}`;
}
