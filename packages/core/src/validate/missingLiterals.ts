import { collectTranslationSurfaceLeaves } from '../shared/localeLeaves/translationSurfaceWalk.js';
import { splitPath } from '../shared/json/path.js';

/**
 * Literal keys present in `resolvedKeys` but missing as string leaves in `localeJson`.
 * Prefer this when you already have a resolved key set (e.g. from one key-site pass)
 * to avoid scanning the project twice.
 */
export function computeMissingLiteralKeysFromResolvedKeys(
  localeJson: unknown,
  resolvedKeys: ReadonlySet<string>,
): string[] {
  const leaves = collectTranslationSurfaceLeaves(localeJson);
  const keySet = new Set(leaves.map((l) => l.path));
  return [...resolvedKeys].filter((k) => !keySet.has(k)).sort(compareDottedPathDepth);
}

/** Sort dotted paths shallow-first, then lexicographically (stable for CLI output). */
export function compareDottedPathDepth(a: string, b: string): number {
  const da = splitPath(a).length;
  const db = splitPath(b).length;
  if (da !== db) return da - db;
  return a.localeCompare(b);
}
