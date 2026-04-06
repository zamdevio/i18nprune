import type { Command } from 'commander';
import { getCommandInvocationPath } from '@/utils/cli/path.js';

/** Primary docs site (Nextra). Set to empty string `""` to force GitHub direct links. */
export const DOCS_SITE_BASE = '';

/** GitHub repo for direct raw documentation links (fallback when site is down or disabled). */
export const GITHUB_USERNAME = 'zamdevio';
export const GITHUB_REPO = 'i18nprune';
export const GITHUB_DOCS_BASE = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/blob/main/docs`;

/** Deep link to a per-command page. Uses site if configured, otherwise falls back to GitHub. */
export function docsCommandUrl(command: string): string {
  const slug = command.trim().toLowerCase();
  if (!DOCS_SITE_BASE) {
    return `${GITHUB_DOCS_BASE}/commands/${slug}/README.md`;
  }
  return `${DOCS_SITE_BASE}/commands/${slug}`;
}

/** Root or generic docs URL with fallback support. Pass `""` or `undefined` for root. */
export function getDocsUrl(path: string = ''): string {
  if (!DOCS_SITE_BASE) {
    return githubDocsUrl(path || 'README.md');
  }
  const p = path.replace(/^\/+/, '');
  return p ? `${DOCS_SITE_BASE}/${p}` : DOCS_SITE_BASE;
}

/** Generic GitHub docs URL helper. Takes relative path like "exports/README.md" or "README.md". */
export function githubDocsUrl(filePath: string = 'README.md'): string {
  const clean = filePath.replace(/^\/+/, '').replace(/\.md$/, '');
  return `${GITHUB_DOCS_BASE}/${clean}.md`;
}

const ROOT = 'i18nprune';

/**
 * Doc slug for help footers (`docs/commands/<slug>/README.md` on the site).
 */
export function docsSlugForCommand(cmd: Command): string {
  const path = getCommandInvocationPath(cmd, ROOT);
  if (path === 'locales list') return 'locales/list';
  if (path === 'locales edit') return 'locales/edit';
  if (path === 'locales dynamic') return 'locales/dynamic';
  if (path === 'locales delete') return 'locales/delete';
  if (path.startsWith('locales ')) return 'locales';
  const first = path.split(' ')[0];
  return (first || cmd.name()).trim().toLowerCase();
}
