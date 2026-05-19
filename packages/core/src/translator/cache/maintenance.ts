import { assertSyncPortResult } from '../../runtime/helpers/sync/index.js';
import { tryDeleteCacheFile } from '../../cache/setup/policy.js';
import type { CacheRuntime, CacheState, CacheWarning } from '../../types/cache/index.js';
import { loadTranslationLocaleCacheFile } from './l2Io.js';
import { resolveTranslationsDir } from './paths.js';

/** Ensures `translations/` exists for per-target L2 files. */
export function prepareTranslationCacheLayout(state: CacheState, runtime: CacheRuntime): CacheWarning[] {
  const warnings: CacheWarning[] = [];
  if (!state.enabled) return warnings;
  const translationsDir = resolveTranslationsDir(state, runtime);
  try {
    assertSyncPortResult(runtime.fs.mkdirp(translationsDir), 'fs.mkdirp', translationsDir);
  } catch (err) {
    warnings.push({
      code: 'cache_dir_unavailable',
      message: `unable to create translations cache dir: ${err instanceof Error ? err.message : String(err)}`,
      path: translationsDir,
    });
    return warnings;
  }
  return [...warnings, ...healTranslationCacheFiles(state, runtime)];
}

/**
 * Drop corrupt or oversize `translations/*.json` files during cache prep (mirrors analysis/files heal).
 *
 * @remarks Best-effort; per-target open still validates on read.
 */
export function healTranslationCacheFiles(state: CacheState, runtime: CacheRuntime): CacheWarning[] {
  const warnings: CacheWarning[] = [];
  if (!state.enabled) return warnings;
  const translationsDir = resolveTranslationsDir(state, runtime);
  let entries: Awaited<ReturnType<CacheRuntime['fs']['listDir']>> = [];
  try {
    const kind = assertSyncPortResult(runtime.fs.statKind(translationsDir), 'fs.statKind', translationsDir);
    if (kind !== 'directory') return warnings;
    entries = assertSyncPortResult(runtime.fs.listDir(translationsDir), 'fs.listDir', translationsDir);
  } catch {
    return warnings;
  }
  for (const entry of entries) {
    if (entry.kind !== 'file' || !entry.name.endsWith('.json')) continue;
    const filePath = runtime.path.join(translationsDir, entry.name);
    const loaded = loadTranslationLocaleCacheFile(filePath, runtime);
    warnings.push(...loaded.warnings);
    const invalid = loaded.warnings.some((w) => w.code === 'cache_malformed' || w.code === 'cache_oversize');
    if (invalid) {
      tryDeleteCacheFile(runtime, filePath);
    }
  }
  return warnings;
}
