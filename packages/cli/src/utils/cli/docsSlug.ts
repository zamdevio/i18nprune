import type { Command } from 'commander';

import { CLI_NAME } from '@/constants/cli.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';

/**
 * Doc slug for help footers (`docs/commands/<slug>` on the site, VitePress clean URLs).
 * Lives under **`utils/cli`** (uses Commander); help output links use **`getDocsUrl` / `docsCommandUrl`** from **`@i18nprune/core`**.
 */
export function docsSlugForCommand(cmd: Command): string {
  const path = getCommandInvocationPath(cmd, CLI_NAME);
  if (path === 'locales list') return 'locales/list';
  if (path === 'locales dynamic') return 'locales/dynamic';
  if (path === 'locales delete') return 'locales/delete';
  if (path.startsWith('locales ')) return 'locales';
  const first = path.split(' ')[0];
  return (first || cmd.name()).trim().toLowerCase();
}
