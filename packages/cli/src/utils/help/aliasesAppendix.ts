import { style } from '@/utils/style/index.js';
import {
  ROOT_COMMAND_ALIAS_LINES,
  ROOT_COMMAND_FLAG_ALIAS_LINES,
  ROOT_FLAG_ALIAS_LINES,
} from '@/argv/flagAliases.js';

/** Root help only — command and flag shorthand reference. */
export function formatAliasesAppendix(): string {
  const lines = [
    '',
    style.bold(style.magenta('Aliases:')),
    style.dim('  Commands'),
    ...ROOT_COMMAND_ALIAS_LINES.map((line) => `  ${style.dim(line)}`),
    style.dim('  Global flags'),
    ...ROOT_FLAG_ALIAS_LINES.map((line) => `  ${style.dim(line)}`),
    style.dim('  Command flags'),
    ...ROOT_COMMAND_FLAG_ALIAS_LINES.map((line) => `  ${style.dim(line)}`),
    '',
  ];
  return lines.join('\n');
}
