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

export type CanonicalSubcommand = (typeof CANONICAL_SUBCOMMANDS)[number];

/** `--<name>` when `name` is shorthand for a canonical subcommand. */
export const DOUBLE_DASH_TO_CANONICAL: Readonly<Record<string, string>> = {
  langs: 'languages',
};

const SUB_SET = new Set<string>(CANONICAL_SUBCOMMANDS);

export const SUBCOMMAND_NAMES = [...CANONICAL_SUBCOMMANDS] as readonly string[];

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
 * Normalizes argv before Commander: e.g. `--langs` → `languages`.
 */
export function preprocessArgv(argv: string[]): string[] {
  const out = [...argv];
  const idx = 2;
  if (idx >= out.length) {
    return out;
  }
  const tok = out[idx];

  const doubled = normalizeDoubleDashCommandToken(tok);
  if (doubled !== null) {
    out[idx] = doubled;
    return out;
  }

  return out;
}
