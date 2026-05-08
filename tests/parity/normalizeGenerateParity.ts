/**
 * Normalize `generate --json` stdout and human stderr so parity snapshots stay stable across
 * machines (absolute paths), clocks (`durationMs`, `*ms` timings), and ANSI progress noise.
 *
 * Baseline command (Phase 1 gate in maintainer/phases/core-architecture.md §5.b): the locked doc
 * names `generate --target ar --metadata` without `--dry-run`. CI uses **`--dry-run`** here so the
 * snapshot does not call remote translators or require credentials; it still exercises the same
 * CLI orchestration + envelope shape as the non-dry path.
 */

/** Strip volatile keys and rewrite absolute fixture paths under {@link fixtureAbs}. */
export function stripVolatileEnvelope(value: unknown, fixtureAbs: string): unknown {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'string') return normalizePathString(value, fixtureAbs);
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((x) => stripVolatileEnvelope(x, fixtureAbs));
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(obj)) {
    if (k === 'durationMs') continue;
    if (k === 'cwd' && typeof val === 'string') {
      out[k] = '<cwd>';
      continue;
    }
    out[k] = stripVolatileEnvelope(val, fixtureAbs);
  }
  return out;
}

export function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortKeysDeep(obj[key]);
  }
  return sorted;
}

export function normalizePathString(s: string, fixtureAbs: string): string {
  if (s.startsWith(fixtureAbs)) return `<fixture>${s.slice(fixtureAbs.length)}`;
  return s;
}

/** Stable JSON text for byte comparison against committed snapshots. */
export function normalizeGenerateJsonEnvelope(stdout: string, fixtureAbs: string): string {
  const trimmed = stdout.trimEnd();
  const parsed: unknown = JSON.parse(trimmed);
  const stripped = stripVolatileEnvelope(parsed, fixtureAbs);
  const sorted = sortKeysDeep(stripped);
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

/**
 * Keep only `[i18nprune] …` logger lines; strip ANSI + `\r` progress noise; normalize paths and ms.
 */
export function normalizeGenerateHumanStderr(raw: string, fixtureAbs: string): string {
  const stripped = raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\r/g, '\n');
  const segments = stripped.split(/(?=\[i18nprune\])/);
  const lines = segments.map((s) => s.trim()).filter((s) => s.startsWith('[i18nprune]'));
  let out = lines.join('\n');
  let rest = out;
  while (rest.includes(fixtureAbs)) {
    rest = rest.split(fixtureAbs).join('<fixture>');
  }
  out = rest;
  out = out.replace(/wall=\d+ms/g, 'wall=<ms>');
  out = out.replace(/avgRequest=\d+ms/g, 'avgRequest=<ms>');
  out = out.replace(/generate · ok · \d+ms/g, 'generate · ok · <ms>');
  return `${out}\n`;
}
