/**
 * Subcommands that emit structured **`--json`** output. Other commands ignore the flag for
 * output (global argv still records it for duplicate-config resolution).
 */
export const COMMANDS_WITH_JSON_OUTPUT = new Set([
  'config',
  'init',
  'validate',
  'missing',
  'sync',
  'generate',
  'quality',
  'review',
  'cleanup',
  'languages',
  'providers',
  'doctor',
  'patch',
  'report',
  // `locales` subcommands use these leaf command names in Commander.
  'list',
  'dynamic',
  'delete',
]);
