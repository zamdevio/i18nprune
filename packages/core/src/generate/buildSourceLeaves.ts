import type { TranslationSurfaceLeaf } from '../types/locales/leaves/translationSurface.js';

/**
 * Build generate source leaves from schema-resolved keys, keeping on-disk source values and
 * `fileOrigin` from the merged locale read.
 */
export function buildGenerateSourceLeavesFromSchema(
  schemaPaths: ReadonlySet<string>,
  allSourceLeaves: readonly TranslationSurfaceLeaf[],
): { leaves: TranslationSurfaceLeaf[]; missingInSourceBundles: string[] } {
  if (schemaPaths.size === 0) {
    return { leaves: [...allSourceLeaves], missingInSourceBundles: [] };
  }
  const byPath = new Map(allSourceLeaves.map((leaf) => [leaf.path, leaf]));
  const leaves: TranslationSurfaceLeaf[] = [];
  const missingInSourceBundles: string[] = [];
  for (const path of [...schemaPaths].sort()) {
    const leaf = byPath.get(path);
    if (leaf) {
      leaves.push(leaf);
    } else {
      missingInSourceBundles.push(path);
    }
  }
  return { leaves, missingInSourceBundles };
}
