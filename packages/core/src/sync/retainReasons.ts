import type { PreservePolicy } from '../types/policies/index.js';
import type { SyncRetainedExtraReason } from '../types/sync/syncRun.js';
import {
  isDeclaredUncertainPath,
  isPreservePath,
  pathMatchesPreserveKey,
} from '../policies/preserve.js';
import { pathUnderAnyUncertainPrefix } from '../shared/reference/paths.js';

export type { SyncRetainedExtraReason };

export type SyncRetainedExtraRow = {
  path: string;
  reason: SyncRetainedExtraReason;
};

/**
 * Classify a single path that survived sync prune despite not being in `resolvedKeys`.
 * Returns `undefined` when no declared/auto keep rule matches (should be rare after prune).
 */
export function classifySyncRetainedExtraReason(
  path: string,
  input: {
    preserve?: PreservePolicy;
    autoUncertainPrefixes?: readonly string[];
  },
): SyncRetainedExtraReason | undefined {
  const preserve = input.preserve;
  if (preserve?.copyKeys?.some((k) => path === k || pathMatchesPreserveKey(path, k))) {
    return 'copyKey';
  }
  if (preserve?.copyPrefixes?.some((p) => path === p || path.startsWith(p))) {
    return 'copyPrefix';
  }
  if (isDeclaredUncertainPath(path, preserve)) {
    return 'uncertainPrefix';
  }
  if (
    input.autoUncertainPrefixes?.length &&
    pathUnderAnyUncertainPrefix(path, input.autoUncertainPrefixes)
  ) {
    return 'autoUncertain';
  }
  return undefined;
}

/** Map extra-vs-scan paths to retain reasons (drops unclassified). */
export function classifySyncRetainedExtras(
  paths: readonly string[],
  input: {
    preserve?: PreservePolicy;
    autoUncertainPrefixes?: readonly string[];
  },
): SyncRetainedExtraRow[] {
  const out: SyncRetainedExtraRow[] = [];
  for (const path of paths) {
    const reason = classifySyncRetainedExtraReason(path, input);
    if (reason) out.push({ path, reason });
  }
  return out;
}

/** True when path is keep-protected for sync (preserve or auto uncertain). */
export function isSyncRetainProtectedPath(
  path: string,
  input: {
    preserve?: PreservePolicy;
    autoUncertainPrefixes?: readonly string[];
  },
): boolean {
  if (isPreservePath(path, input.preserve)) return true;
  if (isDeclaredUncertainPath(path, input.preserve)) return true;
  if (
    input.autoUncertainPrefixes?.length &&
    pathUnderAnyUncertainPrefix(path, input.autoUncertainPrefixes)
  ) {
    return true;
  }
  return false;
}
