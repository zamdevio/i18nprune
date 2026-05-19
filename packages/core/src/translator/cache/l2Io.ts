import { CACHE_SCHEMA_VERSION, MAX_TRANSLATIONS_CACHE_BYTES } from '../../shared/constants/cache.js';
import { isProjectCacheWritable } from '../../cache/setup/policy.js';
import { nowIso, readJsonFileWithLimit, writeJsonAtomic } from '../../cache/io/helpers.js';
import type { CacheRuntime, CacheState, CacheWarning } from '../../types/cache/index.js';
import type { TranslationCacheEntry, TranslationLocaleCacheFile } from '../../types/translator/cache.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';

function isTranslationCacheEntry(value: unknown): value is TranslationCacheEntry {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.text === 'string' &&
    typeof o.leafMeta === 'object' &&
    o.leafMeta !== null &&
    typeof o.providerId === 'string' &&
    typeof o.createdAt === 'string'
  );
}

function isTranslationProviderId(value: string): value is TranslationProviderId {
  return value === 'google' || value === 'mymemory' || value === 'deepl' || value === 'libre' || value === 'llm';
}

/** Validates the shape of a `translations/<code>.json` payload. */
export function validateTranslationLocaleCacheFile(
  data: unknown,
  _filePath: string,
): { ok: true; state: TranslationLocaleCacheFile } | { ok: false; message: string } {
  if (!data || typeof data !== 'object') {
    return { ok: false, message: 'root is not an object' };
  }
  const o = data as Record<string, unknown>;
  if (typeof o.targetLang !== 'string') {
    return { ok: false, message: 'missing or invalid field: targetLang' };
  }
  if (typeof o.translateConfigEpoch !== 'string') {
    return { ok: false, message: 'missing or invalid field: translateConfigEpoch' };
  }
  if (typeof o.inputFilesEpoch !== 'string') {
    return { ok: false, message: 'missing or invalid field: inputFilesEpoch' };
  }
  if (!o.entries || typeof o.entries !== 'object' || Array.isArray(o.entries)) {
    return { ok: false, message: 'missing or invalid field: entries' };
  }
  for (const entry of Object.values(o.entries as Record<string, unknown>)) {
    if (!isTranslationCacheEntry(entry)) {
      return { ok: false, message: 'invalid translation cache entry' };
    }
    if (!isTranslationProviderId(entry.providerId)) {
      return { ok: false, message: 'invalid translation cache entry providerId' };
    }
  }
  if (o.version !== undefined && o.version !== CACHE_SCHEMA_VERSION) {
    return { ok: false, message: `unsupported cache schema version: ${String(o.version)}` };
  }
  return { ok: true, state: data as TranslationLocaleCacheFile };
}

/** Loads and validates one per-target translation cache file. */
export function loadTranslationLocaleCacheFile(
  filePath: string,
  runtime: CacheRuntime,
): { locale?: TranslationLocaleCacheFile; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  const { data, warning } = readJsonFileWithLimit<unknown>(filePath, MAX_TRANSLATIONS_CACHE_BYTES, runtime);
  if (warning) {
    warnings.push({ ...warning, path: filePath });
    return { warnings };
  }
  if (data === undefined) return { warnings };
  const validated = validateTranslationLocaleCacheFile(data, filePath);
  if (!validated.ok) {
    warnings.push({
      code: 'cache_malformed',
      message: `cache translations store invalid (${validated.message})`,
      path: filePath,
    });
    return { warnings };
  }
  return { locale: validated.state, warnings };
}

/** Persists one per-target translation cache file. */
export function saveTranslationLocaleCacheFile(
  state: CacheState,
  runtime: CacheRuntime,
  filePath: string,
  locale: TranslationLocaleCacheFile,
): CacheWarning | undefined {
  if (!state.enabled) return undefined;
  if (!isProjectCacheWritable(state)) {
    return {
      code: 'cache_read_only',
      message: 'cache is read-only; skipped persisting translations cache',
      path: filePath,
    };
  }
  const payload: TranslationLocaleCacheFile = {
    ...locale,
    updatedAt: nowIso(runtime),
    version: CACHE_SCHEMA_VERSION,
  };
  return writeJsonAtomic(filePath, payload, runtime);
}
