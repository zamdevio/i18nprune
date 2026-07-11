import { deepClone } from '../shared/json/clone.js';
import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { scanLeavesForSentinelLeaks } from '../shared/placeholders/sentinelLeak.js';
import type { TranslationSurfaceLeaf } from '../types/locales/leaves/translationSurface.js';

/** Source leaves whose paths are not yet present on the merged target locale JSON. */
export function sourceLeavesMissingFromTarget(
  sourceLeaves: readonly TranslationSurfaceLeaf[],
  existingRaw: unknown | null | undefined,
): TranslationSurfaceLeaf[] {
  if (existingRaw === null || existingRaw === undefined) {
    return [...sourceLeaves];
  }
  const targetSet = new Set(collectTranslationSurfaceLeaves(existingRaw).map((leaf) => leaf.path));
  return sourceLeaves.filter((leaf) => !targetSet.has(leaf.path));
}

/** Union missing-key leaves with source leaves at paths where the target still has sentinel leaks. */
export function activeSourceLeavesForGenerate(input: {
  sourceLeaves: readonly TranslationSurfaceLeaf[];
  existingRaw: unknown | null | undefined;
  fillMissingOnly: boolean;
  repairSentinelLeaks: boolean;
  localeCode: string;
}): TranslationSurfaceLeaf[] {
  const base = input.fillMissingOnly
    ? sourceLeavesMissingFromTarget(input.sourceLeaves, input.existingRaw)
    : [...input.sourceLeaves];
  if (!input.repairSentinelLeaks || input.existingRaw === null || input.existingRaw === undefined) {
    return base;
  }
  const hits = scanLeavesForSentinelLeaks(
    collectTranslationSurfaceLeaves(input.existingRaw),
    input.localeCode,
  );
  if (hits.length === 0) return base;
  const byPath = new Map(input.sourceLeaves.map((leaf) => [leaf.path, leaf] as const));
  const merged = new Map(base.map((leaf) => [leaf.path, leaf] as const));
  for (const hit of hits) {
    const sourceLeaf = byPath.get(hit.path);
    if (sourceLeaf) merged.set(hit.path, sourceLeaf);
  }
  return [...merged.values()];
}

/** Initial working document for generate (seed from existing target when filling gaps only). */
export function workingLocaleForGenerate(input: {
  fillMissingOnly: boolean;
  existingRaw: unknown | null | undefined;
}): unknown {
  if (!input.fillMissingOnly) return {};
  if (input.existingRaw === null || input.existingRaw === undefined) return {};
  return deepClone(input.existingRaw);
}
