/**
 * Builds `packages/cli/src/core/languages/languages.json` from BCP47-style codes and `Intl.DisplayNames`
 * (English + native endonyms). Edit `codes.json` when Google adds languages, then re-run.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import codes from './codes.json' with { type: 'json' };
import { header } from '@/utils/ansi/index.js';
import { style } from '@/utils/style/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');
const outFile = join(repoRoot, 'packages/cli/src/core/languages/languages.json');

export type LanguageRow = {
  code: string;
  english: string;
  native: string;
};

function canonicalTag(lower: string): string {
  try {
    return Intl.getCanonicalLocales(lower)[0] ?? lower;
  } catch {
    return lower;
  }
}

function buildRow(rawCode: string): LanguageRow {
  const code = rawCode.trim().toLowerCase().replace(/_/g, '-');
  const canon = canonicalTag(code);
  const en = new Intl.DisplayNames(['en'], { type: 'language' });
  const english = en.of(canon) ?? code;
  let native: string;
  try {
    const nat = new Intl.DisplayNames([canon], { type: 'language' });
    native = nat.of(canon) ?? english;
  } catch {
    native = english;
  }
  return { code, english, native };
}

function main(): void {
  console.log(
    header('Generating languages', { subtitle: 'Building language catalog…' }),
  );
  const list = (codes as string[]).map(buildRow);
  list.sort((a, b) => a.code.localeCompare(b.code));
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(list, null, 2)}\n`, 'utf8');
  console.log(style.ok(`Wrote ${String(list.length)} languages → ${outFile}`));
}

main();
