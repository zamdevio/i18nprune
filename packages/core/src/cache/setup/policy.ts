import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import {
  ANALYSIS_CACHE_KEY,
  CACHE_SCHEMA_VERSION,
  LEGACY_ANALYSIS_BASENAME,
  LEGACY_SNAPSHOT_BASENAME,
  MAX_SNAPSHOT_BYTES,
} from '../../shared/constants/cache.js';
import type {
  CacheProjectFilesState,
  CacheProjectRunState,
  CacheRuntime,
  CacheState,
  CacheWarning,
} from '../../types/cache/index.js';
import { readJsonFileWithLimit } from '../io/helpers.js';

/**
 * Absolute path for a cache slot under the project cache dir.
 * Omit `cacheKey` for the default **snapshot** (project report) slot.
 */
export function resolveCacheSlotPath(state: CacheState, runtime: CacheRuntime, cacheKey?: string): string {
  const k = cacheKey?.trim();
  if (!k) return state.snapshotPath;
  if (k === ANALYSIS_CACHE_KEY) return state.analysisPath;
  const safe = k.replace(/[^A-Za-z0-9._-]/g, '_');
  return runtime.path.join(state.projectDir, `${safe}.json`);
}

/** Read order: canonical path first, then pre-rename legacy file (migration only). */
export function cacheSlotReadPaths(state: CacheState, runtime: CacheRuntime, cacheKey?: string): readonly string[] {
  const primary = resolveCacheSlotPath(state, runtime, cacheKey);
  const k = cacheKey?.trim();
  if (!k) {
    return [primary, runtime.path.join(state.projectDir, LEGACY_SNAPSHOT_BASENAME)];
  }
  if (k === ANALYSIS_CACHE_KEY) {
    return [primary, runtime.path.join(state.projectDir, LEGACY_ANALYSIS_BASENAME)];
  }
  return [primary];
}

/** Whether the cache is enabled and writable (not read-only mode). */
export function isProjectCacheWritable(state: CacheState): boolean {
  return state.enabled && !state.readOnly;
}

/** Validates the shape of a `files.json` payload without full schema parsing. */
export function validateProjectFilesPayload(
  data: unknown,
  _filePath: string,
): { ok: true; files: CacheProjectFilesState } | { ok: false; message: string } {
  if (!data || typeof data !== 'object') {
    return { ok: false, message: 'root is not an object' };
  }
  const o = data as Record<string, unknown>;
  if (typeof o.files !== 'object' || o.files === null || Array.isArray(o.files)) {
    return { ok: false, message: 'missing or invalid field: files' };
  }
  if (o.version !== undefined && o.version !== CACHE_SCHEMA_VERSION) {
    return { ok: false, message: `unsupported cache schema version: ${String(o.version)}` };
  }
  return { ok: true, files: data as CacheProjectFilesState };
}

/** Validates the shape of a run envelope (snapshot or analysis payload). */
export function validateProjectRunEnvelope(
  data: unknown,
  _filePath: string,
): { ok: true; run: CacheProjectRunState } | { ok: false; message: string } {
  if (!data || typeof data !== 'object') {
    return { ok: false, message: 'root is not an object' };
  }
  const o = data as Record<string, unknown>;
  if (!('data' in o)) {
    return { ok: false, message: 'missing required field: data' };
  }
  if (o.inputFilesEpoch !== undefined && typeof o.inputFilesEpoch !== 'string') {
    return { ok: false, message: 'invalid field type: inputFilesEpoch' };
  }
  return { ok: true, run: data as CacheProjectRunState };
}

/**
 * Reads the first valid run envelope from a list of candidate paths (canonical first, legacy second).
 *
 * @remarks Malformed files accumulate warnings; missing files are skipped silently.
 */
export function loadProjectRunEnvelopeFromCandidates(
  paths: readonly string[],
  runtime: CacheRuntime,
): { run?: CacheProjectRunState; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  for (const filePath of paths) {
    const { data, warning } = readJsonFileWithLimit<unknown>(filePath, MAX_SNAPSHOT_BYTES, runtime);
    if (warning) {
      warnings.push({ ...warning, path: filePath });
      continue;
    }
    if (data === undefined) continue;
    const validated = validateProjectRunEnvelope(data, filePath);
    if (!validated.ok) {
      warnings.push({
        code: 'cache_malformed',
        message: `cache run envelope invalid (${validated.message})`,
        path: filePath,
      });
      continue;
    }
    return { run: validated.run, warnings };
  }
  return { warnings };
}

/** Best-effort delete (corrupt file cleanup); ignores missing paths. */
export function tryDeleteCacheFile(runtime: CacheRuntime, filePath: string): void {
  try {
    if (!assertSyncPortResult(runtime.fs.exists(filePath), 'fs.exists', filePath)) return;
    assertSyncPortResult(runtime.fs.deleteFile(filePath), 'fs.deleteFile', filePath);
  } catch {
    // best-effort only
  }
}
