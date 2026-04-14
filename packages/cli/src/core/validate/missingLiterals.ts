import type { Context } from '@/types/core/context/index.js';
import { collectStringLeaves } from '@/core/json/leaves/index.js';
import { splitPath } from '@/core/json/path/index.js';
import { scanProjectLiteralKeyUsage } from '@/core/extractor/keySites/projectUsage.js';

/**
 * Literal keys present in `resolvedKeys` but missing as string leaves in `localeJson`.
 * Prefer this when you already have a resolved key set (e.g. from one `scanProjectKeyObservations` pass)
 * to avoid scanning the project twice.
 */
export function computeMissingLiteralKeysFromResolvedKeys(
  localeJson: unknown,
  resolvedKeys: ReadonlySet<string>,
): string[] {
  const leaves = collectStringLeaves(localeJson);
  const keySet = new Set(leaves.map((l) => l.path));
  return [...resolvedKeys].filter((k) => !keySet.has(k)).sort(compareDottedPathDepth);
}

/**
 * All resolved literal / template-resolved keys found under `srcRoot`, using **per-file** const maps.
 * Prefer this over merging all sources and a single `buildConstStringMap` — duplicate identifiers
 * (e.g. `const NS` in different files) would otherwise collide and produce wrong resolved paths.
 */
export function resolvedLiteralKeysInProject(ctx: Context): ReadonlySet<string> {
  return scanProjectLiteralKeyUsage(ctx).resolvedKeys;
}

/**
 * Literal keys used in scanned source that are not present as string leaves in `localeJson`.
 * Uses {@link resolvedLiteralKeysInProject} so template + const resolution matches keySites.
 */
export function computeMissingLiteralKeys(ctx: Context, localeJson: unknown): string[] {
  return computeMissingLiteralKeysFromResolvedKeys(localeJson, resolvedLiteralKeysInProject(ctx));
}

/** Sort dotted paths shallow-first, then lexicographically (stable for CLI output). */
export function compareDottedPathDepth(a: string, b: string): number {
  const da = splitPath(a).length;
  const db = splitPath(b).length;
  if (da !== db) return da - db;
  return a.localeCompare(b);
}
