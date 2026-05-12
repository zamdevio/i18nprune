import { assertSyncPortResult } from '../runtime/helpers/sync/index.js';
import { computeCacheProjectId } from './hash.js';
import type { CacheState, CacheStateInput, CacheWarning } from '../types/cache/index.js';

export function resolveCacheState(input: CacheStateInput): CacheState {
  const projectRoot = input.runtime.path.resolve(input.projectRoot);
  const projectId = computeCacheProjectId(projectRoot, {
    path: input.runtime.path,
    hashText: input.runtime.hashText,
  });
  const rootDir = input.cacheRootDir;
  const projectDir = input.runtime.path.join(rootDir, 'projects', projectId);
  const reason = input.noCache === true ? input.disabledReason ?? 'cli_no_cache' : 'default';
  return {
    enabled: input.noCache !== true,
    reason,
    rootDir,
    metaPath: input.runtime.path.join(rootDir, 'meta.json'),
    projectId,
    projectRoot,
    projectDir,
    filesPath: input.runtime.path.join(projectDir, 'files.json'),
    runPath: input.runtime.path.join(projectDir, 'run.json'),
  };
}

/** Validates root paths and write access; disables cache gracefully when unavailable. */
export function initializeCacheState(input: CacheStateInput): {
  state: CacheState;
  warnings: CacheWarning[];
} {
  const base = resolveCacheState(input);
  const warnings: CacheWarning[] = [];
  if (!base.enabled) return { state: base, warnings };

  try {
    const kind = assertSyncPortResult(input.runtime.fs.statKind(base.projectRoot), 'fs.statKind', base.projectRoot);
    if (kind !== 'directory') {
      return {
        state: { ...base, enabled: false, reason: 'project_root_missing' },
        warnings: [
          {
            code: 'project_root_missing',
            message:
              kind === 'missing'
                ? 'project root is missing; cache disabled for this run'
                : 'project root is not a directory; cache disabled for this run',
            path: base.projectRoot,
          },
        ],
      };
    }
  } catch {
    return {
      state: { ...base, enabled: false, reason: 'project_root_missing' },
      warnings: [
        {
          code: 'project_root_missing',
          message: 'project root is missing; cache disabled for this run',
          path: base.projectRoot,
        },
      ],
    };
  }

  try {
    assertSyncPortResult(input.runtime.fs.mkdirp(base.projectDir), 'fs.mkdirp', base.projectDir);
  } catch (err) {
    return {
      state: { ...base, enabled: false, reason: 'cache_dir_unavailable' },
      warnings: [
        {
          code: 'cache_dir_unavailable',
          message: `cache directory unavailable; cache disabled for this run: ${err instanceof Error ? err.message : String(err)}`,
          path: base.projectDir,
        },
      ],
    };
  }
  return { state: base, warnings };
}
