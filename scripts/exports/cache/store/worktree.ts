import { readFileSync } from 'node:fs';

import { buildSnapshot } from '../../inventory/index.js';
import { fingerprintSource } from '../../inventory/fingerprint.js';
import { createWorktreeReader } from '../../inventory/source.js';
import { rootIndexAbsPath, rootIndexRepoPath, WORKTREE_CACHE_KEY } from '../../paths.js';
import { readCachedForProfile } from './files.js';
import { loadCacheMeta } from './meta.js';
import {
  buildTimelineSnapshot,
  parseAndPersistFull,
  persistTimelineSnapshot,
} from './persist.js';
import type { CacheOptions, SnapshotResult } from './types.js';
import { rebuildCacheStatus, shouldReadCache, shouldWriteCache } from './mode.js';
import { isFullSnapshot, isTimelineSnapshot } from './validation.js';

function readWorktreeSource(): string {
  return readFileSync(rootIndexAbsPath, 'utf8');
}

function worktreeFingerprintMatches(snapshot: import('../../inventory/index.js').InventorySnapshot, fingerprint: string): boolean {
  if (!snapshot.sourceFingerprint) return true;
  return snapshot.sourceFingerprint === fingerprint;
}

function resolveProfile(options: CacheOptions): 'full' | 'timeline' {
  if (options.profile) return options.profile;
  if (options.depth === 'light') return 'timeline';
  return 'full';
}

/** Resolve inventory for worktree (disk read + cache under {@link WORKTREE_CACHE_KEY}). */
export function getWorktreeSnapshot(options: CacheOptions = {}): SnapshotResult {
  const source = readWorktreeSource();
  const fingerprint = fingerprintSource(source);
  const profile = resolveProfile(options);
  const reader = createWorktreeReader();
  const cacheKey = WORKTREE_CACHE_KEY;

  if (shouldReadCache(options)) {
    const cached = readCachedForProfile(cacheKey, profile);
    if (cached && worktreeFingerprintMatches(cached, fingerprint)) {
      if (profile === 'full' && isFullSnapshot(cached)) {
        return { snapshot: cached, cache: 'hit', barrelPath: rootIndexRepoPath };
      }
      if (profile === 'timeline' && (isTimelineSnapshot(cached) || isFullSnapshot(cached))) {
        return { snapshot: cached, cache: 'hit', barrelPath: rootIndexRepoPath };
      }
    }
  }

  const buildSnapshotForProfile = () =>
    profile === 'timeline'
      ? buildTimelineSnapshot({ sha: cacheKey, refLabel: 'working tree', source })
      : buildSnapshot({ sha: cacheKey, refLabel: 'working tree', source, reader });

  if (!shouldWriteCache(options)) {
    return { snapshot: buildSnapshotForProfile(), cache: rebuildCacheStatus(options), barrelPath: rootIndexRepoPath };
  }

  const meta = loadCacheMeta();

  if (profile === 'timeline') {
    const snapshot = buildTimelineSnapshot({ sha: cacheKey, refLabel: 'working tree', source });
    persistTimelineSnapshot(cacheKey, 'working tree', snapshot, meta);
    return { snapshot, cache: rebuildCacheStatus(options), barrelPath: rootIndexRepoPath };
  }

  const snapshot = parseAndPersistFull(cacheKey, 'working tree', source, reader, meta);
  return { snapshot, cache: rebuildCacheStatus(options), barrelPath: rootIndexRepoPath };
}
