import type { ParityPolicy, PreservePolicy } from '@/types/config/index.js';

function pathMatchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`);
}

/** Paths listed in parity policy or matching a prefix. */
export function isParityExcluded(path: string, value: string, policy: ParityPolicy | undefined): boolean {
  if (!policy) return false;
  if (policy.excludeKeys?.some((k) => path === k || pathMatchesPrefix(path, k))) return true;
  if (policy.excludePrefixes?.some((p) => path.startsWith(p))) return true;
  if (policy.excludeValues?.some((v) => v === value)) return true;
  return false;
}

/** Paths that must stay verbatim from source (preserve) — also used to skip cleanup removal. */
export function isPreservePath(path: string, policy: PreservePolicy | undefined): boolean {
  if (!policy) return false;
  if (policy.copyKeys?.some((k) => path === k || pathMatchesPrefix(path, k))) return true;
  if (policy.copyPrefixes?.some((p) => path === p || path.startsWith(p))) return true;
  return false;
}
