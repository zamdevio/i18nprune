/**
 * Canonical subcommand names. Positional alias: `langs` → `languages` (see preprocess + Commander alias).
 */
export const CANONICAL_SUBCOMMANDS = [
  'init',
  'config',
  'validate',
  'sync',
  'generate',
  'quality',
  'review',
  'cleanup',
  'languages',
  'doctor',
  'help',
] as const;

/** Positional subcommand shorthand → canonical name. */
export const POSITIONAL_COMMAND_ALIASES: Readonly<Record<string, string>> = {
  langs: 'languages',
};

const SUB_SET = new Set<string>(CANONICAL_SUBCOMMANDS);
const VERSION_SHORT_FLAG = '-V';

const KNOWN_COMMAND_FIRST_TOKEN = new Set([
  'init',
  'config',
  'validate',
  'missing',
  'sync',
  'generate',
  'quality',
  'review',
  'cleanup',
  'languages',
  'langs',
  'doctor',
  'report',
  'version',
  'help',
  'locales',
  'share',
]);

/** Global CLI options that consume the next argv token (must not be treated as a subcommand). */
const GLOBAL_OPTION_WITH_VALUE = new Set([
  '-c',
  '--config',
  '--source',
  '--locales-dir',
  '--src',
  '--functions',
  '--exclude',
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
 * Rewrites global `-V` usage to the `version` subcommand.
 * Keeps explicit command invocations untouched (e.g. `doctor -V`).
 */
function rewriteVersionShortFlag(argv: string[]): string[] {
  const args = argv.slice(2);
  if (args.length === 0 || !args.includes(VERSION_SHORT_FLAG)) {
    return argv;
  }

  const firstCmd = findFirstCommandToken(args);
  if (firstCmd && KNOWN_COMMAND_FIRST_TOKEN.has(firstCmd)) {
    return argv;
  }

  const filtered = args.filter((a) => a !== VERSION_SHORT_FLAG);
  const versionSubOpts = ['--check', '--reset'];
  const hasVersionSubOpt = filtered.some((a) => versionSubOpts.includes(a));
  const next = hasVersionSubOpt
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
  if (POSITIONAL_COMMAND_ALIASES[k]) return POSITIONAL_COMMAND_ALIASES[k]!;
  if (SUB_SET.has(k)) return k;
  return null;
}

/** First subcommand token after global options (post-{@link preprocessArgv}). */
export function resolveActiveCliCommandFromArgv(argv: string[] = process.argv): string | null {
  const token = findFirstCommandToken(preprocessArgv(argv).slice(2));
  if (!token) return null;
  return resolveArgvCommandToken(token) ?? token;
}

/** Normalizes argv before Commander: `langs` → `languages`; global `-V` → `version`. */
export function preprocessArgv(argv: string[]): string[] {
  const out = [...argv];
  const idx = 2;
  if (idx >= out.length) return rewriteVersionShortFlag(out);
  const tok = out[idx];
  const positional = tok !== undefined ? resolveArgvCommandToken(tok) : null;
  if (positional !== null && positional !== tok) {
    out[idx] = positional;
  }
  return rewriteVersionShortFlag(out);
}
