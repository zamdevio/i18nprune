import type { Command } from 'commander';
import { COMMANDS_WITH_JSON_OUTPUT } from '@/constants/jsonoutput.js';
import { CLI_INVOCATION_COMMAND_IDS } from '@/constants/commandInvocation.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';

/**
 * Resolves whether **`--json`** applies to the running subcommand (nested paths like **`share upload`**).
 */
export function resolveJsonOutputCommandId(cmd: Command, rootProgramName: string): string | null {
  const path = getCommandInvocationPath(cmd, rootProgramName);
  const id = CLI_INVOCATION_COMMAND_IDS[path] ?? cmd.name();
  return COMMANDS_WITH_JSON_OUTPUT.has(id) ? id : null;
}
