/**
 * Subcommands that emit structured **`--json`** output. Other commands ignore the flag for
 * output (global argv still records it for duplicate-config resolution).
 */
export const COMMANDS_WITH_JSON_OUTPUT = new Set([
  'config',
  'validate',
  'sync',
  'generate',
  'quality',
  'review',
  'cleanup',
  'languages',
  'doctor',
]);
