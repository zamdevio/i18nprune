import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  'out',
]);

/** Matches extensions scanned for literals and dynamic keys (extension-only; no folder guessing). */
const EXT = /\.(tsx?|jsx?|mjs|cjs|vue|svelte)$/i;

/** Recursive source files under `rootDir` (skips common build dirs). */
export function listSourceFiles(rootDir: string): string[] {
  const out: string[] = [];
  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(p);
      } else if (e.isFile() && EXT.test(e.name)) {
        out.push(p);
      }
    }
  }
  walk(rootDir);
  return out;
}
