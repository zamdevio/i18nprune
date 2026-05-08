import { CACHE_SCHEMA_VERSION, type CacheProjectsIndex, type CliCacheState, type CliCacheWarning } from '@/types/shared/cache/index.js';
import { MAX_PROJECTS_INDEX_BYTES, nowIso, readJsonFileWithLimit, writeJsonAtomic } from './helpers.js';
import { computeProjectId } from './hash.js';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_HEAL_EVERY_RUNS = 20;

export function defaultProjectsIndex(): CacheProjectsIndex {
  return {
    version: CACHE_SCHEMA_VERSION,
    updatedAt: nowIso(),
    projects: {},
    maintenance: { runCount: 0, healEveryRuns: DEFAULT_HEAL_EVERY_RUNS },
  };
}

export function loadProjectsIndex(state: CliCacheState): { index: CacheProjectsIndex; warnings: CliCacheWarning[] } {
  const warnings: CliCacheWarning[] = [];
  if (!state.enabled) return { index: defaultProjectsIndex(), warnings };
  const { data, warning } = readJsonFileWithLimit<CacheProjectsIndex>(state.metaPath, MAX_PROJECTS_INDEX_BYTES);
  if (warning) warnings.push(warning);
  if (!data && fs.existsSync(path.join(state.rootDir, 'projects.json'))) {
    const migrated = migrateLegacyProjectsIndex(state);
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
    return { index: defaultProjectsIndex(), warnings };
  }
  return { index: data, warnings };
}

function migrateLegacyProjectsIndex(state: CliCacheState): { index: CacheProjectsIndex; warnings: CliCacheWarning[] } {
  const warnings: CliCacheWarning[] = [];
  const legacyPath = path.join(state.rootDir, 'projects.json');
  const { data, warning } = readJsonFileWithLimit<{ projects?: Record<string, unknown> }>(legacyPath, MAX_PROJECTS_INDEX_BYTES);
  if (warning) warnings.push(warning);
  const next = defaultProjectsIndex();
  const map = data?.projects;
  if (map && typeof map === 'object') {
    for (const [k, v] of Object.entries(map)) {
      if (typeof v === 'string') {
        next.projects[normalizeProjectRootKey(k)] = v;
        continue;
      }
      if (v && typeof v === 'object' && typeof (v as { root?: unknown }).root === 'string' && typeof (v as { id?: unknown }).id === 'string') {
        const root = (v as { root: string }).root;
        const id = (v as { id: string }).id;
        next.projects[normalizeProjectRootKey(root)] = id;
      }
    }
  }
  const saveWarn = saveProjectsIndex(state, next);
  if (saveWarn) warnings.push(saveWarn);
  try {
    fs.rmSync(legacyPath, { force: true });
  } catch {
    // best-effort migration cleanup only
  }
  return { index: next, warnings };
}

export function saveProjectsIndex(state: CliCacheState, index: CacheProjectsIndex): CliCacheWarning | undefined {
  if (!state.enabled) return undefined;
  return writeJsonAtomic(state.metaPath, { ...index, updatedAt: nowIso(), version: CACHE_SCHEMA_VERSION });
}

export function normalizeProjectRootKey(projectRoot: string): string {
  const normalized = statefulNormalize(projectRoot);
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function statefulNormalize(projectRoot: string): string {
  return projectRoot.replace(/\\/g, '/').replace(/\/+$/g, '');
}

export function touchProjectIndex(state: CliCacheState, index: CacheProjectsIndex): CacheProjectsIndex {
  const next: CacheProjectsIndex = {
    ...index,
    projects: { ...index.projects },
    maintenance: { ...index.maintenance },
  };
  const key = normalizeProjectRootKey(state.projectRoot);
  next.projects[key] = computeProjectId(state.projectRoot);
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
export function maybeHealCacheIndex(state: CliCacheState, index: CacheProjectsIndex): {
  index: CacheProjectsIndex;
  warnings: CliCacheWarning[];
  healed: boolean;
} {
  const warnings: CliCacheWarning[] = [];
  if (!state.enabled || !shouldHeal(index)) {
    return { index, warnings, healed: false };
  }
  const next: CacheProjectsIndex = {
    ...index,
    projects: { ...index.projects },
    maintenance: { ...index.maintenance, lastHealAt: nowIso() },
  };
  const projectsRoot = path.join(state.rootDir, 'projects');

  for (const [projectRoot, id] of Object.entries(next.projects)) {
    const projectDir = path.join(projectsRoot, id);
    if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
      delete next.projects[projectRoot];
    }
  }
  const referencedIds = new Set<string>(Object.values(next.projects));

  try {
    if (fs.existsSync(projectsRoot)) {
      const dirs = fs.readdirSync(projectsRoot, { withFileTypes: true });
      for (const entry of dirs) {
        if (!entry.isDirectory()) continue;
        if (referencedIds.has(entry.name)) continue;
        const orphanDir = path.join(projectsRoot, entry.name);
        fs.rmSync(orphanDir, { recursive: true, force: true });
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
