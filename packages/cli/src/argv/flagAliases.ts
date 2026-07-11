/** Global boolean short → long flag (root program). */
export const GLOBAL_BOOL_FLAG_ALIASES: Readonly<Record<string, string>> = {
  '-j': '--json',
  '-y': '--yes',
  '-n': '--dry-run',
  '-m': '--metadata',
  '-F': '--full',
  '-ds': '--debug-scan',
  '-dc': '--debug-cache',
  '-ncl': '--no-color',
  '-nlc': '--no-log-channel',
  '-nlp': '--no-log-prefix',
  '-nch': '--no-cache',
  '-p': '--patch',
};

/** Global value short → long flag (root program). */
export const GLOBAL_VALUE_FLAG_ALIASES: Readonly<Record<string, string>> = {
  '-T': '--top',
  '-jp': '--json-pretty',
  '-t': '--target',
  '-c': '--config',
  '-ld': '--locales-dir',
  '-fns': '--functions',
  '-e': '--exclude',
  '-cp': '--cache-profile',
};

/** Kits subtree only (path must start with `kits`). */
export const KITS_FLAG_ALIASES: Readonly<Record<string, string>> = {
  '-o': '--out',
  '-fon': '--fail-on',
  '-mxdy': '--max-dynamic',
  '-b': '--baseline',
  '-sb': '--save-baseline',
  '-cn': '--contains',
  '-f': '--focus',
  '-r': '--raw',
};

/**
 * Per-command short → long flags (first path segment or full nested path).
 * `-f` on `generate` maps to `--force`; on `kits` maps via {@link KITS_FLAG_ALIASES} to `--focus`.
 */
export const COMMAND_FLAG_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  generate: {
    '-P': '--provider',
    '-R': '--resume',
    '-W': '--workers',
    '-f': '--force',
    '-nrsl': '--no-repair-sentinel-leaks',
  },
  sync: {
    '-nrsl': '--no-repair-sentinel-leaks',
    '-sm': '--strip-metadata',
  },
  cleanup: {
    '-apk': '--ask-per-key',
  },
  init: {
    '-a': '--auto',
  },
  report: {
    '-fmt': '--format',
  },
  'share delete': {
    '-lo': '--local-only',
  },
  doctor: {
    '-on': '--only',
  },
  patch: {
    '-fx': '--fix',
  },
  languages: {
    '-tbl': '--table',
  },
};

/** Flags that consume the next argv token when expanded from a short form. */
export const VALUE_FLAG_LONGS = new Set([
  '--top',
  '--json-pretty',
  '--target',
  '--config',
  '--locales-dir',
  '--functions',
  '--exclude',
  '--cache-profile',
  '--source',
  '--src',
  '--provider',
  '--workers',
  '--format',
  '--only',
  '--out',
  '--fail-on',
  '--max-dynamic',
  '--baseline',
  '--save-baseline',
  '--contains',
  '--focus',
]);

/** All short flags that consume a value (for argv walking). */
export const VALUE_FLAG_SHORTS = new Set([
  ...Object.keys(GLOBAL_VALUE_FLAG_ALIASES),
  ...Object.keys(KITS_FLAG_ALIASES).filter((k) => k !== '-r'),
  '-P',
  '-W',
  '-fmt',
  '-on',
  '-c',
  '-ld',
  '-fns',
  '-e',
  '-cp',
  '-o',
  '-fon',
  '-mxdy',
  '-b',
  '-sb',
  '-cn',
  '-f',
]);

export function flagLongTakesValue(longFlag: string): boolean {
  return VALUE_FLAG_LONGS.has(longFlag);
}

export function shortFlagTakesValue(shortFlag: string): boolean {
  return VALUE_FLAG_SHORTS.has(shortFlag);
}

export function lookupCommandFlagAlias(
  commandPath: string,
  shortFlag: string,
): string | undefined {
  const exact = COMMAND_FLAG_ALIASES[commandPath]?.[shortFlag];
  if (exact) return exact;
  const head = commandPath.split(' ')[0] ?? '';
  return COMMAND_FLAG_ALIASES[head]?.[shortFlag];
}

export function lookupFlagAlias(shortFlag: string, commandPath: string): string | undefined {
  const scoped = lookupCommandFlagAlias(commandPath, shortFlag);
  if (scoped) return scoped;
  if (commandPath.startsWith('kits')) {
    const kits = KITS_FLAG_ALIASES[shortFlag];
    if (kits) return kits;
  }
  if (shortFlag in GLOBAL_BOOL_FLAG_ALIASES) {
    return GLOBAL_BOOL_FLAG_ALIASES[shortFlag];
  }
  if (shortFlag in GLOBAL_VALUE_FLAG_ALIASES) {
    return GLOBAL_VALUE_FLAG_ALIASES[shortFlag];
  }
  return undefined;
}

/** Short flags that appear in `-h` global options (for root Aliases appendix). */
export const ROOT_FLAG_ALIAS_LINES = [
  '-c config · -j json · -y yes · -n dry-run · -m metadata',
  '-T top · -F full · -ds debug-scan · -dc debug-cache',
  '-ncl no-color · -nlc no-log-channel · -nlp no-log-prefix',
  '-ld locales-dir · -fns functions · -e exclude · -p patch · -nch no-cache · -cp cache-profile',
] as const;

/** Positional command aliases for root `-h` (canonical name in help Commands list). */
export const ROOT_COMMAND_ALIAS_LINES = [
  'v validate · g generate · s sync · cfg config · loc locales · langs languages',
  'q quality · r review · m missing · d doctor · p patch · rep report · prov providers · h help',
  'locales: ls list · dyn dynamic · rm delete',
  'share: up upload · ls list · rm delete',
] as const;

/** Command-scoped flag aliases documented on root `-h` (see each command for full options). */
export const ROOT_COMMAND_FLAG_ALIAS_LINES = [
  'generate: -P provider · -R resume · -W workers · -f force · -nrsl no-repair-sentinel-leaks',
  'sync: -nrsl no-repair-sentinel-leaks · -sm strip-metadata',
  'cleanup: -apk ask-per-key · report: -fmt format · doctor: -on only',
  'share delete: -lo local-only · patch: -fx fix · init: -a auto · languages: -tbl table',
] as const;

/**
 * Additional aliases under consideration (not implemented — see maintainer/temp/aliases.md):
 * - `-src` → `--source` · `-st` → `--strict` (kits/doctor) · `-wu` → `--worker-url` (share)
 * - `-ask` → `--ask` (cleanup/generate/locales delete) · `-rg` already canonical on cleanup
 */
export const PROPOSED_FLAG_ALIASES_NOTE =
  'Proposed (not yet shipped): -src source · -st strict · -wu worker-url · -ask ask';
