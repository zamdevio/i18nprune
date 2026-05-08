import { isParityExcluded } from '../policies/parity.js';
import type { ComputeEnglishIdenticalCountsInput } from '../types/quality/index.js';

/**
 * Count target locale leaves whose string value equals the source locale at the same path,
 * after applying parity exclusions (same rules as the quality operation).
 */
export function computeEnglishIdenticalCounts(
  input: ComputeEnglishIdenticalCountsInput,
): { total: number; perFile: Record<string, number> } {
  const { sourceLeaves, targets, parity } = input;
  const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));

  const perFile: Record<string, number> = {};
  let total = 0;

  for (const { fileBasename, leaves } of targets) {
    let n = 0;
    for (const leaf of leaves) {
      const srcVal = sourceMap.get(leaf.path);
      if (srcVal === undefined) continue;
      if (isParityExcluded(leaf.path, leaf.value, parity)) continue;
      if (leaf.value === srcVal) n += 1;
    }
    perFile[fileBasename] = n;
    total += n;
  }

  return { total, perFile };
}
