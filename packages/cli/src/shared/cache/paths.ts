import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { computeProjectId } from './hash.js';
import type { CliCacheState, CliCacheWarning } from '@/types/shared/cache/index.js';

export function resolveCliCacheState(input: { projectRoot: string; noCache?: boolean; cacheRootDir?: string }): CliCacheState {
  const rootDir = input.cacheRootDir ?? path.join(os.homedir(), '.i18nprune', 'cache');
  const projectRoot = path.resolve(input.projectRoot);
  const projectId = computeProjectId(projectRoot);
  const projectDir = path.join(rootDir, 'projects', projectId);
  return {
    enabled: input.noCache !== true,
    reason: input.noCache === true ? 'cli_no_cache' : 'default',
    rootDir,
    metaPath: path.join(rootDir, 'meta.json'),
    projectId,
    projectRoot,
    projectDir,
    filesPath: path.join(projectDir, 'files.json'),
    runPath: path.join(projectDir, 'run.json'),
  };
}

/** Validates root paths and write access; disables cache gracefully when unavailable. */
export function initializeCliCacheState(input: {
  projectRoot: string;
  noCache?: boolean;
  cacheRootDir?: string;
}): {
  state: CliCacheState;
  warnings: CliCacheWarning[];
} {
  const base = resolveCliCacheState(input);
  const warnings: CliCacheWarning[] = [];
  if (!base.enabled) return { state: base, warnings };
  try {
    const st = fs.statSync(base.projectRoot);
    if (!st.isDirectory()) {
      return {
        state: { ...base, enabled: false, reason: 'project_root_missing' },
        warnings: [
          {
            code: 'project_root_missing',
            message: 'project root is not a directory; cache disabled for this run',
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
    fs.mkdirSync(base.projectDir, { recursive: true });
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
