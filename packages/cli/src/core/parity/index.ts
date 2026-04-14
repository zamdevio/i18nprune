import type { ParityPolicy } from '@/types/config/index.js';

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