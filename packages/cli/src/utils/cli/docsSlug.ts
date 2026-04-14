import type { Command } from 'commander';

import { CLI_NAME } from '@/constants/cli.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';

/**
 * Doc slug for help footers (`docs/commands/<slug>/README.md` on the site).
 * Lives under **`utils/cli`** (uses Commander) so **`constants/docs.ts`** stays importable from the report SPA without bundling Commander.
 */
export function docsSlugForCommand(cmd: Command): string {
  const path = getCommandInvocationPath(cmd, CLI_NAME);
  if (path === 'locales list') return 'locales/list';
  if (path === 'locales edit') return 'locales/edit';
  if (path === 'locales dynamic') return 'locales/dynamic';
  if (path === 'locales delete') return 'locales/delete';
  if (path.startsWith('locales ')) return 'locales';
  const first = path.split(' ')[0];
  return (first || cmd.name()).trim().toLowerCase();
}
