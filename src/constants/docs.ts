import type { Command } from 'commander';
import { getCommandInvocationPath } from '@/utils/cli/path.js';

/** Public docs site (Nextra); paths mirror `docs/` in the repo. */
export const DOCS_SITE_BASE = 'https://i18nprune.zamdev.dev';

/** Deep link to a per-command page (`docs/commands/<name>/README.md` → `/commands/<name>`). */
export function docsCommandUrl(command: string): string {
  const slug = command.trim().toLowerCase();
  return `${DOCS_SITE_BASE}/commands/${slug}`;
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
