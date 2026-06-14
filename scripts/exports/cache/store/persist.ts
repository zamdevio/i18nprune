import { mkdirSync } from 'node:fs';

import {
  buildLightSnapshot,
  buildSnapshot,
  type InventorySnapshot,
} from '../../inventory/index.js';
import { cacheDirForSha } from '../../paths.js';
import { writePathForProfile } from './files.js';
import { writeJsonAtomic } from './io.js';
import { loadCacheMeta, touchMetaEntry } from './meta.js';
import type { CacheMeta, CacheProfile } from './types.js';
import type { SourceReader } from '../../inventory/source.js';

export function persistSnapshot(
  sha: string,
  refLabel: string,
  snapshot: InventorySnapshot,
  profile: CacheProfile,
  meta = loadCacheMeta(),
): InventorySnapshot {
  const dir = cacheDirForSha(sha);
  mkdirSync(dir, { recursive: true });
  writeJsonAtomic(writePathForProfile(sha, profile), snapshot);
  if (profile === 'full') {
    touchMetaEntry(meta, sha, snapshot, refLabel);
  }
  return snapshot;
}

export function parseAndPersistFull(
  sha: string,
  refLabel: string,
  source: string,
  reader: SourceReader,
  meta: CacheMeta,
): InventorySnapshot {
  const snapshot = buildSnapshot({
    sha,
    refLabel,
    source,
    reader,
  });
  return persistSnapshot(sha, refLabel, snapshot, 'full', meta);
}

export function persistTimelineSnapshot(
  sha: string,
  refLabel: string,
  snapshot: InventorySnapshot,
  meta: CacheMeta,
): void {
  persistSnapshot(sha, refLabel, snapshot, 'timeline', meta);
}

export function buildTimelineSnapshot(input: {
  sha: string;
  refLabel: string;
  source: string;
  git?: InventorySnapshot['git'];
}): InventorySnapshot {
  return buildLightSnapshot(input);
}
