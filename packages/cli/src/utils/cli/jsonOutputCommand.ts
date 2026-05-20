import type { Command } from 'commander';
import { COMMANDS_WITH_JSON_OUTPUT } from '@/constants/jsonoutput.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';

/** Maps Commander invocation path → {@link COMMANDS_WITH_JSON_OUTPUT} entry id. */
const INVOCATION_TO_JSON_COMMAND_ID: Record<string, string> = {
  'share upload': 'share',
  'share list': 'share-list',
  'share view': 'share-view',
  'share delete': 'share-delete',
  // `share delete --all` uses share-delete-all when resolved at runtime (see shareDelete).
  'locales list': 'list',
  'locales dynamic': 'dynamic',
  'locales delete': 'delete',
};

/**
 * Resolves whether **`--json`** applies to the running subcommand (nested paths like **`share upload`**).
 */
export function resolveJsonOutputCommandId(cmd: Command, rootProgramName: string): string | null {
  const path = getCommandInvocationPath(cmd, rootProgramName);
  const id = INVOCATION_TO_JSON_COMMAND_ID[path] ?? cmd.name();
  return COMMANDS_WITH_JSON_OUTPUT.has(id) ? id : null;
}
