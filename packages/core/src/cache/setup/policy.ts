import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import { CACHE_SCHEMA_VERSION, MAX_ANALYSIS_BYTES } from '../../shared/constants/cache.js';
import type {
  CacheProjectFileRecord,
  CacheProjectFilesState,
  CacheProjectRunState,
  CacheRuntime,
  CacheState,
  CacheWarning,
} from '../../types/cache/index.js';
import { readJsonFileWithLimit } from '../io/helpers.js';

/** Absolute path for the project `analysis.json` cache file. */
export function resolveAnalysisCachePath(state: CacheState): string {
  return state.analysisPath;
}

/** Whether the cache is enabled and writable (not read-only mode). */
export function isProjectCacheWritable(state: CacheState): boolean {
  return state.enabled && !state.readOnly;
}

function isFileRecordMap(value: unknown): value is Record<string, CacheProjectFileRecord> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  if (!isFileRecordMap(o.files)) {
    return { ok: false, message: 'missing or invalid field: files' };
  }
  if (o.localeSegments !== undefined && !isFileRecordMap(o.localeSegments)) {
    return { ok: false, message: 'invalid field: localeSegments' };
  }
  if (o.localesLayout !== undefined) {
    const layout = o.localesLayout;
    if (
      !layout ||
      typeof layout !== 'object' ||
      typeof (layout as Record<string, unknown>).mode !== 'string' ||
      typeof (layout as Record<string, unknown>).structure !== 'string' ||
      typeof (layout as Record<string, unknown>).directory !== 'string' ||
      typeof (layout as Record<string, unknown>).source !== 'string'
    ) {
      return { ok: false, message: 'invalid field: localesLayout' };
    }
  }
  if (o.version !== undefined && o.version !== CACHE_SCHEMA_VERSION) {
    return { ok: false, message: `unsupported cache schema version: ${String(o.version)}` };
  }
  return { ok: true, files: data as CacheProjectFilesState };
}

/** Validates the shape of an `analysis.json` run envelope. */
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
 * Loads the `analysis.json` run envelope.
 *
 * @remarks Malformed files accumulate warnings; missing files are skipped silently.
 */
export function loadProjectRunEnvelope(
  state: CacheState,
  runtime: CacheRuntime,
): { run?: CacheProjectRunState; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  const filePath = state.analysisPath;
  const { data, warning } = readJsonFileWithLimit<unknown>(filePath, MAX_ANALYSIS_BYTES, runtime);
  if (warning) {
    warnings.push({ ...warning, path: filePath });
    return { warnings };
  }
  if (data === undefined) return { warnings };
  const validated = validateProjectRunEnvelope(data, filePath);
  if (!validated.ok) {
    warnings.push({
      code: 'cache_malformed',
      message: `cache analysis envelope invalid (${validated.message})`,
      path: filePath,
    });
    return { warnings };
  }
  return { run: validated.run, warnings };
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
