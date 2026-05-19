import { TRANSLATIONS_DIR } from '../../shared/constants/cache.js';
import type { CacheRuntime, CacheState } from '../../types/cache/index.js';

/** Directory holding per-target translation cache files (`<code>.json`). */
export function resolveTranslationsDir(state: CacheState, runtime: CacheRuntime): string {
  return runtime.path.join(state.projectDir, TRANSLATIONS_DIR);
}

/** Per-target L2 file: `translations/<targetLang>.json`. */
export function resolveLocaleTranslationCachePath(
  state: CacheState,
  runtime: CacheRuntime,
  targetLang: string,
): string {
  const safe = targetLang.replace(/[/\\]/g, '_');
  return runtime.path.join(resolveTranslationsDir(state, runtime), `${safe}.json`);
}
