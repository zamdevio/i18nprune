import fs from 'node:fs';
import path from 'node:path';

/**
 * Basenames (without `.json`) of locale files under `localesDir`, excluding the source locale.
 * Ignores `*.meta.json`; only scans `*.json` in `localesDir`.
 */
export function listOtherLocaleCodes(localesDir: string, sourceBase: string): string[] {
  if (!fs.existsSync(localesDir)) return [];
  return fs
    .readdirSync(localesDir)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.meta.json'))
    .map((f) => path.basename(f, '.json'))
    .filter((c) => c !== sourceBase);
}
