import { readFileSync } from 'node:fs';

import { buildSnapshot } from '../../inventory/index.js';
import { fingerprintSource } from '../../inventory/fingerprint.js';
import { createWorktreeReader } from '../../inventory/source.js';
import { gitRevParse } from '../../git/index.js';
import { rootIndexAbsPath, rootIndexRepoPath } from '../../paths.js';
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

/** Resolve inventory for worktree (disk read + cache keyed by HEAD + source fingerprint). */
export function getWorktreeSnapshot(options: CacheOptions = {}): SnapshotResult {
  const headSha = gitRevParse('HEAD');
  const source = readWorktreeSource();
  const fingerprint = fingerprintSource(source);
  const profile = resolveProfile(options);
  const reader = createWorktreeReader();

  if (shouldReadCache(options)) {
    const cached = readCachedForProfile(headSha, profile);
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
      ? buildTimelineSnapshot({ sha: headSha, refLabel: 'working tree', source })
      : buildSnapshot({ sha: headSha, refLabel: 'working tree', source, reader });

  if (!shouldWriteCache(options)) {
    return { snapshot: buildSnapshotForProfile(), cache: rebuildCacheStatus(options), barrelPath: rootIndexRepoPath };
  }

  const meta = loadCacheMeta();

  if (profile === 'timeline') {
    const snapshot = buildTimelineSnapshot({ sha: headSha, refLabel: 'working tree', source });
    persistTimelineSnapshot(headSha, 'working tree', snapshot, meta);
    return { snapshot, cache: rebuildCacheStatus(options), barrelPath: rootIndexRepoPath };
  }

  const snapshot = parseAndPersistFull(headSha, 'working tree', source, reader, meta);
  return { snapshot, cache: rebuildCacheStatus(options), barrelPath: rootIndexRepoPath };
}
