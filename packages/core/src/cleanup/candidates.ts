import { isPreservePath } from '../policies/preserve.js';
import { pathUnderAnyUncertainPrefix } from '../shared/reference/paths.js';
import type { StringLeaf } from '../types/json/index.js';
import type { PreservePolicy } from '../types/policies/index.js';
import type { ProjectLiteralKeyUsage } from '../types/extractor/projectLiteralKeyUsage.js';

/** True when `key` is the root path or nested under a root in `usedRoots` (array segment `[` counts as root). */
export function pathUnderRoot(key: string, roots: ReadonlySet<string>): boolean {
  for (const r of roots) {
    if (key === r || key.startsWith(`${r}.`) || key.startsWith(`${r}[`)) return true;
  }
  return false;
}

export type CleanupCandidateInput = {
  leaves: readonly StringLeaf[];
  usage: ProjectLiteralKeyUsage;
  preserve?: PreservePolicy;
  uncertainPrefixes: readonly string[];
  /** When true, drop candidates under {@link pathUnderAnyUncertainPrefix}. */
  filterUncertainPrefixes: boolean;
};

/**
 * Unused key paths in source locale JSON after scan + preserve + optional uncertain-prefix rules.
 */
export function computeCleanupCandidateKeys(input: CleanupCandidateInput): {
  allKeyPaths: Set<string>;
  candidates: string[];
  excludedUncertain: number;
} {
  const allKeyPaths = new Set(input.leaves.map((l) => l.path));
  const used = new Set<string>();
  for (const k of allKeyPaths) {
    if (input.usage.resolvedKeys.has(k)) used.add(k);
  }
  const unused = [...allKeyPaths].filter((k) => !used.has(k));
  let candidates = unused.filter((k) => !isPreservePath(k, input.preserve));
  let excludedUncertain = 0;

  if (input.filterUncertainPrefixes) {
    const before = candidates.length;
    candidates = candidates.filter((k) => !pathUnderAnyUncertainPrefix(k, input.uncertainPrefixes));
    excludedUncertain = before - candidates.length;
  }

  return { allKeyPaths, candidates, excludedUncertain };
}
