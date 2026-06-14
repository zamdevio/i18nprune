import { existsSync } from 'node:fs';

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

export function readCachedForProfile(sha: string, profile: CacheProfile): InventorySnapshot | undefined {
  const filePath = readPathForProfile(sha, profile);
  if (!existsSync(filePath)) return undefined;
  const snapshot = readJsonFile<InventorySnapshot>(filePath);
  if (!snapshot || !isValidSnapshot(snapshot)) return undefined;
  if (!snapshotMatchesSha(sha, snapshot)) return undefined;
  if (profile === 'timeline' && !isTimelineSnapshot(snapshot)) return undefined;
  if (profile === 'full' && isTimelineSnapshot(snapshot)) return undefined;
  return snapshot;
}

export function snapshotPathsForSha(sha: string): string[] {
  return [fullSnapshotPathForSha(sha), timelineSnapshotPathForSha(sha)];
}
