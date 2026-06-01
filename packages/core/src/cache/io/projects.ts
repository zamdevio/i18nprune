import { CACHE_SCHEMA_VERSION, DEFAULT_HEAL_EVERY_RUNS, MAX_PROJECTS_INDEX_BYTES } from '../../shared/constants/cache.js';
import type {
  CacheProjectsIndex,
  CacheRuntime,
  CacheState,
  CacheWarning,
} from '../../types/cache/index.js';
import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import { nowIso, readJsonFileWithLimit, writeJsonAtomic } from './helpers.js';
import { toPosixPath } from '../../shared/path/index.js';
import { computeCacheProjectId } from './hash.js';
import { isProjectCacheWritable } from '../setup/policy.js';

/** Fresh meta index with zero projects and default maintenance schedule. */
export function defaultProjectsIndex(runtime?: Pick<CacheRuntime, 'system'>): CacheProjectsIndex {
  return {
    version: CACHE_SCHEMA_VERSION,
    updatedAt: nowIso(runtime),
    projects: {},
    maintenance: { runCount: 0, healEveryRuns: DEFAULT_HEAL_EVERY_RUNS },
  };
}

/** Loads the global `meta.json` projects index; falls back to a fresh default on any read error. */
export function loadProjectsIndex(
  state: CacheState,
  runtime: CacheRuntime,
): { index: CacheProjectsIndex; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  if (!state.enabled) return { index: defaultProjectsIndex(runtime), warnings };
  const { data, warning } = readJsonFileWithLimit<CacheProjectsIndex>(state.metaPath, MAX_PROJECTS_INDEX_BYTES, runtime);
  if (warning) warnings.push(warning);
  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.projects !== 'object' ||
    typeof data.maintenance !== 'object' ||
    typeof data.maintenance.runCount !== 'number' ||
    typeof data.maintenance.healEveryRuns !== 'number'
  ) {
    return { index: defaultProjectsIndex(runtime), warnings };
  }
  return { index: data, warnings };
}

/** Persists the meta index; skips (with warning) when cache is read-only. */
export function saveProjectsIndex(
  state: CacheState,
  index: CacheProjectsIndex,
  runtime: CacheRuntime,
): CacheWarning | undefined {
  if (!state.enabled) return undefined;
  if (!isProjectCacheWritable(state)) {
    return {
      code: 'cache_read_only',
      message: 'cache is read-only; skipped persisting meta index',
      path: state.metaPath,
    };
  }
  return writeJsonAtomic(state.metaPath, { ...index, updatedAt: nowIso(runtime), version: CACHE_SCHEMA_VERSION }, runtime);
}

/**
 * Normalizes a project root path for use as a meta-index key.
 * Backslashes are replaced with forward slashes and a trailing `/` is always appended.
 */
export function normalizeProjectRootKey(projectRoot: string): string {
  const normalized = toPosixPath(projectRoot).normalize('NFC').replace(/\/+$/g, '');
  return `${normalized}/`;
}

/** Registers the current project in the meta index and increments the run counter. */
export function touchProjectIndex(state: CacheState, index: CacheProjectsIndex, runtime?: CacheRuntime): CacheProjectsIndex {
  const next: CacheProjectsIndex = {
    ...index,
    projects: { ...index.projects },
    maintenance: { ...index.maintenance },
  };
  const key = normalizeProjectRootKey(state.projectRoot);
  next.projects[key] = computeCacheProjectId(state.projectRoot, {
    path: runtime?.path,
    hashText: runtime?.hashText,
  });
  next.maintenance.runCount += 1;
  return next;
}

function shouldHeal(index: CacheProjectsIndex): boolean {
  const every = Math.max(1, Math.trunc(index.maintenance.healEveryRuns || DEFAULT_HEAL_EVERY_RUNS));
  return index.maintenance.runCount % every === 0;
}

/**
 * Periodic cache self-heal: prunes meta entries whose project dir is missing and
 * removes orphan project dirs not referenced in meta. Runs every `healEveryRuns` invocations.
 */
export function maybeHealCacheIndex(
  state: CacheState,
  index: CacheProjectsIndex,
  runtime: CacheRuntime,
): {
  index: CacheProjectsIndex;
  warnings: CacheWarning[];
  healed: boolean;
} {
  const warnings: CacheWarning[] = [];
  if (!state.enabled || !shouldHeal(index)) {
    return { index, warnings, healed: false };
  }
  const next: CacheProjectsIndex = {
    ...index,
    projects: { ...index.projects },
    maintenance: { ...index.maintenance, lastHealAt: nowIso(runtime) },
  };
  const projectsRoot = runtime.path.join(state.rootDir, 'projects');

  for (const [projectRoot, id] of Object.entries(next.projects)) {
    const projectDir = runtime.path.join(projectsRoot, id);
    const kind = assertSyncPortResult(runtime.fs.statKind(projectDir), 'fs.statKind', projectDir);
    if (kind !== 'directory') {
      delete next.projects[projectRoot];
    }
  }
  const referencedIds = new Set<string>(Object.values(next.projects));

  try {
    if (assertSyncPortResult(runtime.fs.exists(projectsRoot), 'fs.exists', projectsRoot)) {
      const dirs = assertSyncPortResult(runtime.fs.listDir(projectsRoot), 'fs.listDir', projectsRoot);
      for (const entry of dirs) {
        if (entry.kind !== 'directory') continue;
        if (referencedIds.has(entry.name)) continue;
        const orphanDir = runtime.path.join(projectsRoot, entry.name);
        if (!runtime.deleteDir) continue;
        runtime.deleteDir(orphanDir);
      }
    }
  } catch (err) {
    warnings.push({
      code: 'cache_io_error',
      message: `cache self-heal failed: ${err instanceof Error ? err.message : String(err)}`,
      path: projectsRoot,
    });
  }

  return { index: next, warnings, healed: true };
}
