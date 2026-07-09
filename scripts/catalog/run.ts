import path from 'node:path';

import { resolveCatalogCodesJsonPath, resolveDefaultLanguagesJsonPath } from './paths.js';
import { writeGeneratedLanguageCatalogToPath } from './write.js';

const LOG = '[generate:languages]';

function displayPath(absolute: string): string {
  const rel = path.relative(process.cwd(), absolute);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : absolute;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
}

export function runLanguageCatalogGeneration(): void {
  const codesPath = resolveCatalogCodesJsonPath();
  const outputPath = resolveDefaultLanguagesJsonPath();
  if (!codesPath || !outputPath) {
    throw new Error(
      'Could not resolve monorepo catalog paths. Run from the i18nprune repository root.',
    );
  }

  const t0 = performance.now();
  console.log(`${LOG} Input   ${displayPath(codesPath)}`);
  console.log(`${LOG} Output  ${displayPath(outputPath)}`);

  const { rows, bytesWritten, inputCodeCount } = writeGeneratedLanguageCatalogToPath(outputPath);

  const ms = Math.round(performance.now() - t0);
  console.log(
    `${LOG} Wrote   ${rows.length} language row(s) from ${inputCodeCount} code(s) → ${formatBytes(bytesWritten)} in ${ms}ms`,
  );
  console.log(`${LOG} Done. Commit ${displayPath(outputPath)} if contents changed.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const thisFile = new URL(import.meta.url).pathname;

if (invokedPath === thisFile) {
  runLanguageCatalogGeneration();
}
