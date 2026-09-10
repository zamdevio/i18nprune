import { pathUnderAnyUncertainPrefix, pathUnderUncertainPrefix } from '../shared/reference/paths.js';
import type { PreservePolicy } from '../types/policies/index.js';

/** True when `path` equals `prefix` or is nested under `prefix` (dot or bracket segments). */
export function pathMatchesPreserveKey(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`);
}

/** Strip trailing dots so `navigation.` matches uncertain-prefix boundary rules. */
export function normalizeSyncKeepPrefix(prefix: string): string {
  return prefix.replace(/\.+$/, '');
}

/**
 * Config prefixes/keys that sync must retain (and hydrate via schema expansion).
 * Normalized for `pathUnderUncertainPrefix` (no trailing-dot startsWith semantics).
 */
export function collectDeclaredSyncKeepPrefixes(policy: PreservePolicy | undefined): string[] {
  if (!policy) return [];
  const out: string[] = [];
  for (const p of policy.copyPrefixes ?? []) {
    const n = normalizeSyncKeepPrefix(p);
    if (n) out.push(n);
  }
  for (const p of policy.uncertainPrefixes ?? []) {
    const n = normalizeSyncKeepPrefix(p);
    if (n) out.push(n);
  }
  for (const k of policy.copyKeys ?? []) {
    if (k) out.push(k);
  }
  return [...new Set(out)];
}

/** Merge auto-detected uncertain prefixes with declared preserve keep roots (deduped). */
export function mergeSyncKeepPrefixes(
  autoUncertainPrefixes: readonly string[] | undefined,
  policy: PreservePolicy | undefined,
): string[] {
  return [...new Set([...(autoUncertainPrefixes ?? []), ...collectDeclaredSyncKeepPrefixes(policy)])];
}

/**
 * Expand sync schema paths so declared preserve / uncertain trees present in **source**
 * hydrate into targets even when the scan never resolved those keys.
 */
export function expandSchemaPathsForPreserve(
  schemaPaths: ReadonlySet<string>,
  sourceLeafPaths: readonly string[],
  policy: PreservePolicy | undefined,
): Set<string> {
  const out = new Set(schemaPaths);
  if (!policy) return out;
  const uncertain = (policy.uncertainPrefixes ?? [])
    .map(normalizeSyncKeepPrefix)
    .filter(Boolean);
  for (const path of sourceLeafPaths) {
    if (isPreservePath(path, policy)) {
      out.add(path);
      continue;
    }
    if (uncertain.length > 0 && pathUnderAnyUncertainPrefix(path, uncertain)) {
      out.add(path);
    }
  }
  return out;
}

/** True when path falls under a declared `uncertainPrefixes` entry. */
export function isDeclaredUncertainPath(path: string, policy: PreservePolicy | undefined): boolean {
  if (!policy?.uncertainPrefixes?.length) return false;
  for (const p of policy.uncertainPrefixes) {
    const n = normalizeSyncKeepPrefix(p);
    if (n && pathUnderUncertainPrefix(path, n)) return true;
  }
  return false;
}

/**
 * Paths that must stay verbatim from source (`policies.preserve`) — also used to skip cleanup removal
 * and (when configured) `generate --resume` preserve skips.
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
