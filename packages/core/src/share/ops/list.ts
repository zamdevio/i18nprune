import type { ShareListInput, ShareListResult } from '../../types/share/shareRun.js';
import { loadShareJsonFile, resolveShareJsonPath } from '../cache/io/shareJson.js';

/** Lists local `share.json` entries for the current project cache. */
export function runShareList(input: ShareListInput): ShareListResult {
  const cache = input.ctx.cache;
  if (!cache?.state.enabled || cache.state.readOnly || !cache.runtime) {
    return { entries: [], issues: [], heal: { repaired: false, actions: [], details: [] } };
  }
  const sharePath = resolveShareJsonPath(cache.state.projectDir, cache.runtime.path);
  const loaded = loadShareJsonFile({
    sharePath,
    runtime: cache.runtime,
    cacheReadOnly: cache.state.readOnly,
  });
  return { entries: loaded.file.entries, issues: loaded.issues, heal: loaded.heal };
}
