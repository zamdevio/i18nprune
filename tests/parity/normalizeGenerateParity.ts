/**
 * Normalize `generate --json` stdout and human stderr so parity snapshots stay stable across
 * machines (absolute paths), clocks (`durationMs`, `*ms` timings), and ANSI progress noise.
 *
 * Baseline command: the locked doc names `generate --target ar --metadata` without `--dry-run`.
 * CI uses **`--dry-run`** here so the
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
    const mapped = value.map((x) => stripVolatileEnvelope(x, fixtureAbs));
    const first = mapped[0];
    if (first && typeof first === 'object' && first !== null && 'path' in first) {
      return [...mapped].sort((a, b) =>
        String((a as { path: string }).path).localeCompare(String((b as { path: string }).path)),
      );
    }
    return mapped;
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
  const progressBlock = out.match(
    /(\[i18nprune\] \[warn\] 3 translation call\(s\)[\s\S]*?)(?=\[i18nprune\])/,
  );
  if (progressBlock) {
    const header = progressBlock[1]!.split('\n')[0]!;
    const pathLines = progressBlock[1]!
      .split('\n')
      .slice(1)
      .map((line) => line.trim())
      .filter((line) => /^\[\d+\/\d+\]/.test(line))
      .sort((a, b) => {
        const pathA = a.replace(/^\[\d+\/\d+\]\s*/, '');
        const pathB = b.replace(/^\[\d+\/\d+\]\s*/, '');
        return pathA.localeCompare(pathB);
      })
      .map((line, index, sorted) => {
        const path = line.replace(/^\[\d+\/\d+\]\s*/, '');
        return `  [${String(index + 1)}/${String(sorted.length)}] ${path}`;
      });
    const reordered = `${header}\n\n${pathLines.join('\n')}\n`;
    out = out.replace(progressBlock[1]!, reordered);
  }
  return `${out}\n`;
}
