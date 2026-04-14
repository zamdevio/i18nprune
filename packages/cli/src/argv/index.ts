export type { CanonicalSubcommand } from '@/types/argv/index.js';

/**
 * Canonical subcommand names (no short aliases). Optional `--langs` → `languages` only.
 */
export const CANONICAL_SUBCOMMANDS = [
  'init',
  'config',
  'validate',
  'sync',
  'generate',
  'fill',
  'quality',
  'review',
  'cleanup',
  'languages',
  'doctor',
  'help',
] as const;

/** `--<name>` when `name` is shorthand for a canonical subcommand. */
export const DOUBLE_DASH_TO_CANONICAL: Readonly<Record<string, string>> = {
  langs: 'languages',
};

const SUB_SET = new Set<string>(CANONICAL_SUBCOMMANDS);

export const SUBCOMMAND_NAMES = [...CANONICAL_SUBCOMMANDS] as readonly string[];

const VERSION_FLAGS = new Set(['-v', '--version']);

/**
 * First token of a subcommand when present (`locales list` → `locales`).
 * Used to detect whether `-v` should be rewritten to the `version` subcommand.
 */
const KNOWN_COMMAND_FIRST_TOKEN = new Set([
  'init',
  'config',
  'validate',
  'missing',
  'sync',
  'generate',
  'fill',
  'quality',
  'review',
  'cleanup',
  'languages',
  'doctor',
  'report',
  'version',
  'help',
  'locales',
]);

/** Global CLI options that consume the next argv token (must not be treated as a subcommand). */
const GLOBAL_OPTION_WITH_VALUE = new Set([
  '-c',
  '--config',
  '--source',
  '--locales-dir',
  '--src',
  '--functions',
  '--report-file',
  '--report-format',
]);

function findFirstCommandToken(args: string[]): string | null {
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith('-')) continue;
    const prev = i > 0 ? args[i - 1]! : '';
    if (GLOBAL_OPTION_WITH_VALUE.has(prev)) continue;
    return a;
  }
  return null;
}

/**
 * When `-v` / `--version` is used without an explicit subcommand, rewrite argv to run **`version`**
 * so **`preAction`**, **`RunOptions`** (quiet/silent), and the banner match **`i18nprune version`**.
 */
function rewriteVersionFlagsToVersionSubcommand(argv: string[]): string[] {
  const args = argv.slice(2);
  if (args.length === 0 || !args.some((a) => VERSION_FLAGS.has(a))) {
    return argv;
  }

  const firstCmd = findFirstCommandToken(args);
  if (firstCmd && KNOWN_COMMAND_FIRST_TOKEN.has(firstCmd)) {
    return argv;
  }

  const filtered = args.filter((a) => !VERSION_FLAGS.has(a));
  const versionSubOpts = ['--check', '--reset'];
  const hasVersionSubOpt = filtered.some((a) => versionSubOpts.includes(a));

  const next =
    hasVersionSubOpt
      ? (() => {
          const globalsOnly = filtered.filter((a) => !versionSubOpts.includes(a));
          const vopts = filtered.filter((a) => versionSubOpts.includes(a));
          return [...globalsOnly, 'version', ...vopts];
        })()
      : [...filtered, 'version'];

  const out = [...argv];
  out.splice(2, out.length - 2, ...next);
  return out;
}

export function resolveArgvCommandToken(input: string): string | null {
  const k = input.toLowerCase().trim();
  if (DOUBLE_DASH_TO_CANONICAL[k]) return DOUBLE_DASH_TO_CANONICAL[k]!;
  if (SUB_SET.has(k)) return k;
  return null;
}

/**
 * Map `--<subcommand-or-shorthand>` to the canonical subcommand. Leaves `--help` unchanged.
 */
function normalizeDoubleDashCommandToken(tok: string): string | null {
  if (!tok.startsWith('--')) {
    return null;
  }
  const rest = tok.slice(2);
  if (rest === '' || rest === 'help') {
    return null;
  }
  return resolveArgvCommandToken(rest);
}

/**
 * Normalizes argv before Commander: e.g. `--langs` → `languages`; `-v` / `--version` → `version` subcommand.
 */
export function preprocessArgv(argv: string[]): string[] {
  const out = [...argv];
  const idx = 2;
  if (idx >= out.length) {
    return out;
  }
  const tok = out[idx];

  const doubled = tok !== undefined ? normalizeDoubleDashCommandToken(tok) : null;
  if (doubled !== null) {
    out[idx] = doubled;
  }

  return rewriteVersionFlagsToVersionSubcommand(out);
}
