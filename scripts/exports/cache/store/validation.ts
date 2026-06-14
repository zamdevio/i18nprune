import type { InventorySnapshot } from '../../inventory/index.js';

export function isValidSummary(value: unknown): value is InventorySnapshot['summary'] {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  const root = s.root as Record<string, unknown> | undefined;
  if (!root || typeof root.flat !== 'number' || typeof root.namespace !== 'number') return false;
  if (typeof root.stable !== 'number') return false;
  return Array.isArray(s.subpaths);
}

export function isValidSnapshot(value: unknown): value is InventorySnapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    s.version === 1 &&
    s.toolVersion === 1 &&
    typeof s.sha === 'string' &&
    typeof s.refLabel === 'string' &&
    typeof s.generatedAt === 'string' &&
    isValidSummary(s.summary) &&
    Array.isArray(s.symbols) &&
    Array.isArray(s.namespaces) &&
    Array.isArray(s.edges)
  );
}

export function isFullSnapshot(snapshot: InventorySnapshot): boolean {
  return snapshot.scanDepth !== 'light';
}

export function isTimelineSnapshot(snapshot: InventorySnapshot): boolean {
  return snapshot.scanDepth === 'light';
}

export function snapshotMatchesSha(sha: string, snapshot: InventorySnapshot): boolean {
  return snapshot.sha === sha;
}
