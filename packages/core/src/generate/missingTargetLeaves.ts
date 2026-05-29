import { deepClone } from '../shared/json/clone.js';
import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
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

/** Initial working document for generate (seed from existing target when filling gaps only). */
export function workingLocaleForGenerate(input: {
  fillMissingOnly: boolean;
  existingRaw: unknown | null | undefined;
}): unknown {
  if (!input.fillMissingOnly) return {};
  if (input.existingRaw === null || input.existingRaw === undefined) return {};
  return deepClone(input.existingRaw);
}
