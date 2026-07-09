import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/** Walk upward until monorepo markers (`scripts/catalog/codes.json` + core catalog dir) are found. */
export function findMonorepoRoot(startDir: string = moduleDir): string | null {
  let dir = startDir;
  for (let depth = 0; depth < 10; depth += 1) {
    const codesJson = path.join(dir, 'scripts', 'catalog', 'codes.json');
    const catalogDir = path.join(
      dir,
      'packages',
      'core',
      'src',
      'shared',
      'languages',
      'catalog',
    );
    if (fs.existsSync(codesJson) && fs.existsSync(catalogDir)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function resolveCatalogCodesJsonPath(startDir: string = moduleDir): string | null {
  const repoRoot = findMonorepoRoot(startDir);
  if (!repoRoot) return null;
  return path.join(repoRoot, 'scripts', 'catalog', 'codes.json');
}

/** Committed artifact consumed by portable core (`import … languages.json`). Monorepo dev only. */
export function resolveDefaultLanguagesJsonPath(startDir: string = moduleDir): string | null {
  const repoRoot = findMonorepoRoot(startDir);
  if (!repoRoot) return null;
  return path.join(
    repoRoot,
    'packages',
    'core',
    'src',
    'shared',
    'languages',
    'catalog',
    'languages.json',
  );
}
