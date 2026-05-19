import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import type { CacheProjectsIndex, CacheRuntime, CacheState, CacheWarning } from '../../types/cache/index.js';
import { loadProjectsIndex, maybeHealCacheIndex, saveProjectsIndex, touchProjectIndex } from '../io/projects.js';
import { loadProjectFilesState, loadProjectRunState } from '../io/state.js';
import { prepareTranslationCacheLayout } from '../../translator/cache/maintenance.js';
import { tryDeleteCacheFile } from './policy.js';

/**
 * Per-run cache maintenance: touches the project mapping in meta, runs periodic
 * global self-heal, ensures the project directory exists, and validates current
 * project cache files (dropping corrupt ones so this run can repopulate cleanly).
 */
export function prepareCacheForRun(
  state: CacheState,
  runtime: CacheRuntime,
): {
  index: CacheProjectsIndex;
  warnings: CacheWarning[];
} {
  const warnings: CacheWarning[] = [];
  const loaded = loadProjectsIndex(state, runtime);
  warnings.push(...loaded.warnings);

  const touched = touchProjectIndex(state, loaded.index, runtime);
  const healed = maybeHealCacheIndex(state, touched, runtime);
  warnings.push(...healed.warnings);

  const saveWarn = saveProjectsIndex(state, healed.index, runtime);
  if (saveWarn) warnings.push(saveWarn);

  try {
    assertSyncPortResult(runtime.fs.mkdirp(state.projectDir), 'fs.mkdirp', state.projectDir);
  } catch (err) {
    warnings.push({
      code: 'cache_dir_unavailable',
      message: `unable to create cache project dir: ${err instanceof Error ? err.message : String(err)}`,
      path: state.projectDir,
    });
    return { index: healed.index, warnings };
  }

  const fileState = loadProjectFilesState(state, runtime);
  warnings.push(...fileState.warnings);
  const analysisState = loadProjectRunState(state, runtime);
  warnings.push(...analysisState.warnings);
  warnings.push(...prepareTranslationCacheLayout(state, runtime));

  const hasInvalidFiles = fileState.warnings.some((w) => w.code === 'cache_malformed' || w.code === 'cache_oversize');
  const hasInvalidAnalysis = analysisState.warnings.some((w) => w.code === 'cache_malformed' || w.code === 'cache_oversize');
  if (hasInvalidFiles) {
    try {
      assertSyncPortResult(runtime.fs.deleteFile(state.filesPath), 'fs.deleteFile', state.filesPath);
    } catch {
      // best-effort only
    }
  }
  if (hasInvalidAnalysis) {
    tryDeleteCacheFile(runtime, state.analysisPath);
  }

  try {
    assertSyncPortResult(runtime.fs.mkdirp(runtime.path.dirname(state.filesPath)), 'fs.mkdirp', runtime.path.dirname(state.filesPath));
  } catch {
    // ignore; runtime writes are still guarded
  }

  return { index: healed.index, warnings };
}
