import type { PreservePolicy } from '../types/policies/index.js';

/** True when `path` equals `prefix` or is nested under `prefix` (dot or bracket segments). */
export function pathMatchesPreserveKey(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`);
}

/**
 * Paths that must stay verbatim from source (`policies.preserve`) — also used to skip cleanup removal
 * and (when configured) fill skips.
 */
export function isPreservePath(path: string, policy: PreservePolicy | undefined): boolean {
  if (!policy) return false;
  if (policy.copyKeys?.some((k) => path === k || pathMatchesPreserveKey(path, k))) return true;
  if (policy.copyPrefixes?.some((p) => path === p || path.startsWith(p))) return true;
  return false;
}

/** Drop paths that are preserve-protected; returns a new array. */
export function filterOutPreservedPaths(paths: string[], policy: PreservePolicy | undefined): string[] {
  if (!policy?.copyKeys?.length && !policy?.copyPrefixes?.length) return paths;
  return paths.filter((p) => !isPreservePath(p, policy));
}

export function partitionPreserve(
  paths: string[],
  policy: PreservePolicy | undefined,
): { removable: string[]; preserved: string[] } {
  const preserved: string[] = [];
  const removable: string[] = [];
  for (const p of paths) {
    if (isPreservePath(p, policy)) preserved.push(p);
    else removable.push(p);
  }
  return { removable, preserved };
}
