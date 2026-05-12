import { spawnSync } from 'node:child_process';

/**
 * True when `rg --version` succeeds (ripgrep on PATH).
 */
export function isRipgrepAvailable(): boolean {
  const r = spawnSync('rg', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}

export function rgFixedStringSearch(rootDir: string, needle: string): boolean {
  const r = spawnSync(
    'rg',
    ['--fixed-strings', '--quiet', '--glob', '!**/node_modules/**', needle, rootDir],
    { encoding: 'utf8' },
  );
  return r.status === 0;
}

export type RgStringHit = {
  path: string;
  line: number;
  submatchText?: string;
};

type RgJsonMatch = {
  type: string;
  data?: {
    path?: { text?: string };
    line_number?: number;
    submatches?: Array<{ match?: { text?: string } }>;
  };
};

/**
 * First `maxHits` literal-string matches under `rootDir` (fixed-string, not regex).
 * Used for human-readable “string still appears in src” warnings — not static key proof.
 */
export function rgFixedStringSearchLocations(
  rootDir: string,
  needle: string,
  maxHits: number,
): RgStringHit[] {
  const r = spawnSync(
    'rg',
    [
      '--json',
      '--fixed-strings',
      '--glob',
      '!**/node_modules/**',
      '-m',
      String(maxHits),
      needle,
      rootDir,
    ],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  if (r.status !== 0 && r.status !== 1) {
    return [];
  }
  const out: RgStringHit[] = [];
  const lines = (r.stdout ?? '').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    let row: RgJsonMatch;
    try {
      row = JSON.parse(line) as RgJsonMatch;
    } catch {
      continue;
    }
    if (row.type !== 'match' || !row.data?.path?.text) continue;
    const pathText = row.data.path.text;
    const ln = row.data.line_number;
    if (typeof ln !== 'number') continue;
    const sm = row.data.submatches?.[0]?.match?.text;
    out.push({ path: pathText, line: ln, submatchText: sm });
    if (out.length >= maxHits) break;
  }
  return out;
}
