import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsCatalogDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(scriptsCatalogDir, '..', '..');

/** Generator input (raw BCP-47-ish codes). */
export const catalogCodesJsonPath = path.join(scriptsCatalogDir, 'codes.json');

/** Committed artifact consumed by portable core (`import … languages.json`). */
export const defaultLanguagesJsonPath = path.join(
  repoRoot,
  'packages/core/src/shared/languages/catalog/languages.json',
);
