/**
 * Canonical subcommand names. Positional aliases expand in {@link preprocessArgv}.
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

/** Positional subcommand shorthand → canonical name (top-level only). */
export const POSITIONAL_COMMAND_ALIASES: Readonly<Record<string, string>> = {
  langs: 'languages',
  loc: 'locales',
  v: 'validate',
  g: 'generate',
  cfg: 'config',
  s: 'sync',
  q: 'quality',
  r: 'review',
  m: 'missing',
  d: 'doctor',
  p: 'patch',
  rep: 'report',
  prov: 'providers',
  h: 'help',
};

/** Second-token aliases under group commands. */
export const GROUP_SUBCOMMAND_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  locales: {
    ls: 'list',
    dyn: 'dynamic',
    rm: 'delete',
  },
  share: {
    up: 'upload',
    ls: 'list',
    rm: 'delete',
  },
};

const SUB_SET = new Set<string>(CANONICAL_SUBCOMMANDS);
const VERSION_SHORT_FLAG = '-V';
const GROUP_COMMANDS = new Set(['locales', 'share']);

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
  'loc',
  'share',
  'kits',
  'providers',
  'patch',
  'v',
  'g',
  'cfg',
  's',
  'q',
  'r',
  'm',
  'd',
  'p',
  'rep',
  'prov',
  'h',
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
    '-y': '--yes',
    '-n': '--dry-run',
    '-m': '--metadata',
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

function rewritePositionalCommandAliases(argv: string[]): string[] {
  const out = [...argv];
  let currentGroup: string | null = null;
  for (let i = 2; i < out.length; i++) {
    const token = out[i]!;
    if (token.startsWith('-')) {
      if (GLOBAL_OPTION_WITH_VALUE.has(token)) {
        i += 1;
      }
      continue;
    }
    const key = token.toLowerCase();
    let rewritten = token;
    if (i === 2) {
      const top = POSITIONAL_COMMAND_ALIASES[key];
      if (top) rewritten = top;
      currentGroup = GROUP_COMMANDS.has(rewritten) ? rewritten : null;
    } else if (currentGroup) {
      const sub = GROUP_SUBCOMMAND_ALIASES[currentGroup]?.[key];
      if (sub) rewritten = sub;
      currentGroup = null;
    }
    out[i] = rewritten;
  }
  return out;
}

export function resolveArgvCommandToken(input: string): string | null {
  const k = input.toLowerCase().trim();
  if (POSITIONAL_COMMAND_ALIASES[k]) return POSITIONAL_COMMAND_ALIASES[k]!;
  if (SUB_SET.has(k)) return k;
  return null;
}

/** Resolve one help topic segment (e.g. `loc` → `locales`, `ls` under locales → `list`). */
export function resolveHelpTopicToken(parentGroup: string | null, token: string): string {
  const k = token.toLowerCase().trim();
  const top = POSITIONAL_COMMAND_ALIASES[k];
  if (top) return top;
  if (parentGroup) {
    const sub = GROUP_SUBCOMMAND_ALIASES[parentGroup]?.[k];
    if (sub) return sub;
  }
  return token;
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

/** Normalizes argv before Commander: positional aliases; global `-V` → `version`; short flags → long. */
export function preprocessArgv(argv: string[]): string[] {
  const expanded = expandArgvShortFlags(argv);
  const aliased = rewritePositionalCommandAliases(expanded);
  return rewriteVersionShortFlag(aliased);
}
