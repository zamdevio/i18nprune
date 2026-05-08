import fs from 'node:fs';
import path from 'node:path';
import type { CacheProjectsIndex, CliCacheState, CliCacheWarning } from '@/types/shared/cache/index.js';
import { loadProjectsIndex, maybeHealCacheIndex, saveProjectsIndex, touchProjectIndex } from './projects.js';
import { loadProjectFilesState, loadProjectRunState } from './state.js';

/**
 * Per-run cache maintenance:
 * - touches project mapping in meta
 * - runs periodic global self-heal
 * - ensures current project directory exists
 * - validates current project's files/run cache readability
 */
export function prepareCacheForRun(state: CliCacheState): {
  index: CacheProjectsIndex;
  warnings: CliCacheWarning[];
} {
  const warnings: CliCacheWarning[] = [];
  const loaded = loadProjectsIndex(state);
  warnings.push(...loaded.warnings);

  const touched = touchProjectIndex(state, loaded.index);
  const healed = maybeHealCacheIndex(state, touched);
  warnings.push(...healed.warnings);

  const saveWarn = saveProjectsIndex(state, healed.index);
  if (saveWarn) warnings.push(saveWarn);

  try {
    fs.mkdirSync(state.projectDir, { recursive: true });
  } catch (err) {
    warnings.push({
      code: 'cache_dir_unavailable',
      message: `unable to create cache project dir: ${err instanceof Error ? err.message : String(err)}`,
      path: state.projectDir,
    });
    return { index: healed.index, warnings };
  }

  const fileState = loadProjectFilesState(state);
  warnings.push(...fileState.warnings);
  const runState = loadProjectRunState(state);
  warnings.push(...runState.warnings);

  // If either cache file is malformed/unusable, drop it now so this run can repopulate cleanly.
  const hasInvalidFiles = fileState.warnings.some((w) => w.code === 'cache_malformed' || w.code === 'cache_oversize');
  const hasInvalidRun = runState.warnings.some((w) => w.code === 'cache_malformed' || w.code === 'cache_oversize');
  if (hasInvalidFiles) {
    try {
      fs.rmSync(state.filesPath, { force: true });
    } catch {
      // best-effort only
    }
  }
  if (hasInvalidRun) {
    try {
      fs.rmSync(state.runPath, { force: true });
    } catch {
      // best-effort only
    }
  }

  // Ensure known essential files path parents always exist.
  try {
    fs.mkdirSync(path.dirname(state.filesPath), { recursive: true });
  } catch {
    // ignore; runtime writes are still guarded
  }

  return { index: healed.index, warnings };
}
