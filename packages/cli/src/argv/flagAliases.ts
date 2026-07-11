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

/** Global value short → long flag (root program). `--source` and `--src` stay long-only (avoid confusion). */
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
  '-fcs': '--focus',
  '-r': '--raw',
};

/** Per-command short → long flags (first path segment or full nested path). */
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
  share: {
    '-wu': '--worker-url',
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
    '-flt': '--filter',
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
  '--filter',
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
  '-flt',
  '-fcs',
  '-wu',
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
