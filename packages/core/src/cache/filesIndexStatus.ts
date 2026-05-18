import type {
  CacheProjectFilesState,
  CacheRuntime,
  CacheWarning,
  FilesIndexStatus,
} from '../types/cache/index.js';

function isDefaultEmptyIndex(prev: CacheProjectFilesState): boolean {
  const noSrc = Object.keys(prev.files).length === 0;
  const noLocales = !prev.localeSegments || Object.keys(prev.localeSegments).length === 0;
  const noLayout = prev.localesLayout === undefined;
  return noSrc && noLocales && noLayout;
}

/**
 * Classify `files.json` load outcome for dispatch and debug-cache messaging.
 * Does not throw; unknown/malformed/empty indices are reported explicitly.
 */
export function resolveFilesIndexStatus(input: {
  prev: CacheProjectFilesState;
  warnings: readonly CacheWarning[];
  filesPath: string;
  runtime: CacheRuntime;
}): FilesIndexStatus {
  const indexWarnings = input.warnings.filter((w) => w.path === undefined || w.path === input.filesPath);
  if (indexWarnings.some((w) => w.code === 'cache_malformed' || w.code === 'cache_oversize')) {
    return { kind: 'malformed' };
  }
  const exists = input.runtime.fs.exists(input.filesPath);
  if (!exists) {
    return { kind: 'missing' };
  }
  if (isDefaultEmptyIndex(input.prev)) {
    return { kind: 'empty' };
  }
  return { kind: 'ok' };
}
