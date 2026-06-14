import { existsSync, unlinkSync } from 'node:fs';

import { buildSnapshot, type InventorySnapshot } from '../../inventory/index.js';
import { createGitReader } from '../../inventory/source.js';
import { ExportError } from '../../errors/index.js';
import { gitShowFile, shortSha, type SourceRef } from '../../git/index.js';
import { rootIndexRepoPath } from '../../paths.js';
import { readCachedForProfile, snapshotPathsForSha } from './files.js';
import { loadCacheMeta, touchMetaEntry } from './meta.js';
import {
  buildTimelineSnapshot,
  parseAndPersistFull,
  persistTimelineSnapshot,
} from './persist.js';
import type { CacheOptions, SnapshotResult } from './types.js';
import { isValidSnapshot, snapshotMatchesSha } from './validation.js';
import { readJsonFile } from './io.js';

function barrelMissingError(ref: SourceRef & { kind: 'commit' }): ExportError {
  return new ExportError(`Root barrel not found at ref "${ref.label}"`, 'barrel_missing', {
    details: {
      ref: ref.label,
      sha: shortSha(ref.sha),
      path: rootIndexRepoPath,
      suggestion:
        'This ref may predate packages/core or the export scripts path. Try a newer tag or `git log -- packages/core/src/index.ts`.',
    },
  });
}

function resolveProfile(options: CacheOptions): 'full' | 'timeline' {
  if (options.profile) return options.profile;
  if (options.depth === 'light') return 'timeline';
  return 'full';
}

/** Resolve inventory for a commit ref via cache + `git show`. */
export function getCommitSnapshot(
  ref: SourceRef & { kind: 'commit' },
  options: CacheOptions = {},
): SnapshotResult {
  const { sha, label } = ref;
  const profile = resolveProfile(options);
  const meta = loadCacheMeta();

  if (!options.noCache) {
    const cached = readCachedForProfile(sha, profile);
    if (cached) {
      if (profile === 'full') {
        touchMetaEntry(meta, sha, cached, label);
      }
      return { snapshot: cached, cache: 'hit', barrelPath: rootIndexRepoPath };
    }

    for (const stalePath of snapshotPathsForSha(sha)) {
      if (!existsSync(stalePath)) continue;
      const stale = readJsonFile<InventorySnapshot>(stalePath);
      if (!stale || !isValidSnapshot(stale) || !snapshotMatchesSha(sha, stale)) {
        try {
          unlinkSync(stalePath);
        } catch {
          /* best effort */
        }
      }
    }
  }

  const source = gitShowFile(sha, rootIndexRepoPath);
  if (source === null) {
    throw barrelMissingError(ref);
  }

  if (options.noCache) {
    const reader = createGitReader(sha);
    const snapshot =
      profile === 'timeline'
        ? buildTimelineSnapshot({ sha, refLabel: label, source, git: options.git ?? undefined })
        : buildSnapshot({ sha, refLabel: label, source, reader });
    return { snapshot, cache: 'bypass', barrelPath: rootIndexRepoPath };
  }

  if (profile === 'timeline') {
    const snapshot = buildTimelineSnapshot({
      sha,
      refLabel: label,
      source,
      git: options.git ?? undefined,
    });
    persistTimelineSnapshot(sha, label, snapshot, meta);
    return { snapshot, cache: 'miss', barrelPath: rootIndexRepoPath };
  }

  const snapshot = parseAndPersistFull(sha, label, source, createGitReader(sha), meta);
  return { snapshot, cache: 'miss', barrelPath: rootIndexRepoPath };
}
