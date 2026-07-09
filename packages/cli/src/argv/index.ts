/**
 * Canonical subcommand names. Positional alias: `langs` → `languages` (see preprocess + Commander alias).
 */
import { CLI_INVOCATION_COMMAND_IDS } from '@/constants/commandInvocation.js';

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
  'kits',
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
  '--top',
  '-T',
  '--json-pretty',
  '-jp',
  '-t',
  '--target',
  '-o',
  '--out',
  '-fon',
  '--fail-on',
  '-mxdy',
  '--max-dynamic',
  '-b',
  '--baseline',
  '-sb',
  '--save-baseline',
  '-cn',
  '--contains',
  '-f',
  '--focus',
]);

/** Expand kit/global short flags before Commander parses argv. */
function expandArgvShortFlags(argv: string[]): string[] {
  const VALUE_SHORTS = new Set([
    '-T',
    '-jp',
    '-t',
    '-o',
    '-fon',
    '-mxdy',
    '-b',
    '-sb',
    '-cn',
    '-f',
  ]);
  const BOOL_SHORTS: Record<string, string> = {
    '-j': '--json',
    '-F': '--full',
    '-ds': '--debug-scan',
    '-dc': '--debug-cache',
    '-r': '--raw',
  };
  const VALUE_LONG: Record<string, string> = {
    '-T': '--top',
    '-jp': '--json-pretty',
    '-t': '--target',
    '-o': '--out',
    '-fon': '--fail-on',
    '-mxdy': '--max-dynamic',
    '-b': '--baseline',
    '-sb': '--save-baseline',
    '-cn': '--contains',
    '-f': '--focus',
  };

  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token in BOOL_SHORTS) {
      out.push(BOOL_SHORTS[token]!);
      continue;
    }
    if (token in VALUE_LONG) {
      out.push(VALUE_LONG[token]!);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        out.push(next);
        i += 1;
      }
      continue;
    }
    if (VALUE_SHORTS.has(token)) {
      out.push(token);
      continue;
    }
    out.push(token);
  }
  return out;
}

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

function resolveInvocationPathFromArgv(args: string[]): string {
  const segments: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a.startsWith('-')) {
      if (GLOBAL_OPTION_WITH_VALUE.has(a)) {
        const next = args[i + 1];
        if (next !== undefined && !next.startsWith('-')) i += 1;
      }
      continue;
    }
    segments.push(a);
    if (segments.length >= 2) break;
  }
  return segments.join(' ');
}

/** First subcommand token after global options (post-{@link preprocessArgv}). */
export function resolveActiveCliCommandFromArgv(argv: string[] = process.argv): string | null {
  const args = preprocessArgv(argv).slice(2);
  const invocation = resolveInvocationPathFromArgv(args);
  const mapped = CLI_INVOCATION_COMMAND_IDS[invocation];
  if (mapped) return mapped;
  const token = findFirstCommandToken(args);
  if (!token) return null;
  return resolveArgvCommandToken(token) ?? token;
}

/** Normalizes argv before Commander: `langs` → `languages`; global `-V` → `version`; short flags → long. */
export function preprocessArgv(argv: string[]): string[] {
  const expanded = expandArgvShortFlags(argv);
  const out = [...expanded];
  const idx = 2;
  if (idx >= out.length) return rewriteVersionShortFlag(out);
  const tok = out[idx];
  const positional = tok !== undefined ? resolveArgvCommandToken(tok) : null;
  if (positional !== null && positional !== tok) {
    out[idx] = positional;
  }
  return rewriteVersionShortFlag(out);
}
