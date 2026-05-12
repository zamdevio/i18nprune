import {
  CACHE_SCHEMA_VERSION,
  type CacheProjectsIndex,
  type CacheRuntime,
  type CacheState,
  type CacheWarning,
} from '../types/cache/index.js';
import { assertSyncPortResult } from '../runtime/helpers/sync/index.js';
import { MAX_PROJECTS_INDEX_BYTES, nowIso, readJsonFileWithLimit, writeJsonAtomic } from './helpers.js';
import { computeCacheProjectId } from './hash.js';

const DEFAULT_HEAL_EVERY_RUNS = 20;

export function defaultProjectsIndex(runtime?: Pick<CacheRuntime, 'system'>): CacheProjectsIndex {
  return {
    version: CACHE_SCHEMA_VERSION,
    updatedAt: nowIso(runtime),
    projects: {},
    maintenance: { runCount: 0, healEveryRuns: DEFAULT_HEAL_EVERY_RUNS },
  };
}

export function loadProjectsIndex(
  state: CacheState,
  runtime: CacheRuntime,
): { index: CacheProjectsIndex; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  if (!state.enabled) return { index: defaultProjectsIndex(runtime), warnings };
  const { data, warning } = readJsonFileWithLimit<CacheProjectsIndex>(state.metaPath, MAX_PROJECTS_INDEX_BYTES, runtime);
  if (warning) warnings.push(warning);
  if (!data && assertSyncPortResult(runtime.fs.exists(runtime.path.join(state.rootDir, 'projects.json')), 'fs.exists', state.rootDir)) {
    const migrated = migrateLegacyProjectsIndex(state, runtime);
    warnings.push(...migrated.warnings);
    return { index: migrated.index, warnings };
  }
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

function migrateLegacyProjectsIndex(
  state: CacheState,
  runtime: CacheRuntime,
): { index: CacheProjectsIndex; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  const legacyPath = runtime.path.join(state.rootDir, 'projects.json');
  const { data, warning } = readJsonFileWithLimit<{ projects?: Record<string, unknown> }>(
    legacyPath,
    MAX_PROJECTS_INDEX_BYTES,
    runtime,
  );
  if (warning) warnings.push(warning);
  const next = defaultProjectsIndex(runtime);
  const map = data?.projects;
  if (map && typeof map === 'object') {
    for (const [k, v] of Object.entries(map)) {
      if (typeof v === 'string') {
        next.projects[normalizeProjectRootKey(k)] = v;
        continue;
      }
      if (
        v &&
        typeof v === 'object' &&
        typeof (v as { root?: unknown }).root === 'string' &&
        typeof (v as { id?: unknown }).id === 'string'
      ) {
        const root = (v as { root: string }).root;
        const id = (v as { id: string }).id;
        next.projects[normalizeProjectRootKey(root)] = id;
      }
    }
  }
  const saveWarn = saveProjectsIndex(state, next, runtime);
  if (saveWarn) warnings.push(saveWarn);
  try {
    assertSyncPortResult(runtime.fs.deleteFile(legacyPath), 'fs.deleteFile', legacyPath);
  } catch {
    // best-effort migration cleanup only
  }
  return { index: next, warnings };
}

export function saveProjectsIndex(
  state: CacheState,
  index: CacheProjectsIndex,
  runtime: CacheRuntime,
): CacheWarning | undefined {
  if (!state.enabled) return undefined;
  return writeJsonAtomic(state.metaPath, { ...index, updatedAt: nowIso(runtime), version: CACHE_SCHEMA_VERSION }, runtime);
}

export function normalizeProjectRootKey(projectRoot: string): string {
  const normalized = projectRoot.replace(/\\/g, '/').replace(/\/+$/g, '');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

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
 * Removes cache drift:
 * - delete meta entries whose projects/<id> dir is missing
 * - delete projects/<id> dirs not referenced by meta
 * Runs periodically based on `maintenance.healEveryRuns`.
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
