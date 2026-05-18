import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { splitPath } from '../shared/json/path.js';
import type { TranslationSurfaceLeaf } from '../types/locales/leaves/translationSurface.js';

/** Stable composite key for a locale leaf (`segmentRelativePath` + logical path). */
export function encodeLocaleLeafIdentity(segmentRelativePath: string, logicalPath: string): string {
  return `${segmentRelativePath}\u0001${logicalPath}`;
}

/** Logical paths present in at least one source segment (code keys are logical-path only). */
export function logicalPathsFromSourceLeaves(leaves: ReadonlyArray<Pick<TranslationSurfaceLeaf, 'path'>>): Set<string> {
  return new Set(leaves.map((l) => l.path));
}

/**
 * Literal keys in `resolvedKeys` with no matching logical path in `sourceLeaves`.
 * Uses {@link logicalPathsFromSourceLeaves} (union across segments).
 */
export function computeMissingLiteralKeysFromLeaves(
  sourceLeaves: ReadonlyArray<Pick<TranslationSurfaceLeaf, 'path'>>,
  resolvedKeys: ReadonlySet<string>,
): string[] {
  const keySet = logicalPathsFromSourceLeaves(sourceLeaves);
  return [...resolvedKeys].filter((k) => !keySet.has(k)).sort(compareDottedPathDepth);
}

/**
 * Literal keys present in `resolvedKeys` but missing as string leaves in `localeJson`.
 * Prefer {@link computeMissingLiteralKeysFromLeaves} when layout may span multiple source segments.
 */
export function computeMissingLiteralKeysFromResolvedKeys(
  localeJson: unknown,
  resolvedKeys: ReadonlySet<string>,
): string[] {
  const leaves = collectTranslationSurfaceLeaves(localeJson);
  return computeMissingLiteralKeysFromLeaves(leaves, resolvedKeys);
}

/** Sort dotted paths shallow-first, then lexicographically (stable for CLI output). */
export function compareDottedPathDepth(a: string, b: string): number {
  const da = splitPath(a).length;
  const db = splitPath(b).length;
  if (da !== db) return da - db;
  return a.localeCompare(b);
}
