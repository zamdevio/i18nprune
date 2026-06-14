import { existsSync, unlinkSync } from 'node:fs';

import type { InventorySnapshot } from '../../inventory/index.js';
import { fullSnapshotPathForSha, timelineSnapshotPathForSha } from '../../paths.js';
import type { CacheProfile } from './types.js';
import { readJsonFile } from './io.js';
import { isTimelineSnapshot, isValidSnapshot, snapshotMatchesSha } from './validation.js';

/** Canonical write target per profile (never cross-contaminate). */
export function writePathForProfile(sha: string, profile: CacheProfile): string {
  return profile === 'timeline' ? timelineSnapshotPathForSha(sha) : fullSnapshotPathForSha(sha);
}

export function readPathForProfile(sha: string, profile: CacheProfile): string {
  return writePathForProfile(sha, profile);
}

export function snapshotPathsForSha(sha: string): string[] {
  return [fullSnapshotPathForSha(sha), timelineSnapshotPathForSha(sha)];
}

/** Remove one snapshot file when JSON is corrupt, SHA mismatches, or toolVersion is stale. */
export function purgeStaleSnapshotFile(filePath: string, sha: string): boolean {
  if (!existsSync(filePath)) return false;
  const snapshot = readJsonFile<InventorySnapshot>(filePath);
  if (snapshot && isValidSnapshot(snapshot) && snapshotMatchesSha(sha, snapshot)) {
    return false;
  }
  try {
    unlinkSync(filePath);
  } catch {
    /* best effort */
  }
  return true;
}

/** Drop invalid full + timeline snapshots for a commit dir. */
export function purgeStaleCacheForSha(sha: string): void {
  for (const filePath of snapshotPathsForSha(sha)) {
    purgeStaleSnapshotFile(filePath, sha);
  }
}

export function readCachedForProfile(sha: string, profile: CacheProfile): InventorySnapshot | undefined {
  const filePath = readPathForProfile(sha, profile);
  if (!existsSync(filePath)) return undefined;
  const snapshot = readJsonFile<InventorySnapshot>(filePath);
  if (!snapshot || !isValidSnapshot(snapshot) || !snapshotMatchesSha(sha, snapshot)) {
    purgeStaleSnapshotFile(filePath, sha);
    return undefined;
  }
  if (profile === 'timeline' && !isTimelineSnapshot(snapshot)) {
    purgeStaleSnapshotFile(filePath, sha);
    return undefined;
  }
  if (profile === 'full' && isTimelineSnapshot(snapshot)) {
    purgeStaleSnapshotFile(filePath, sha);
    return undefined;
  }
  return snapshot;
}
