import type { CoreContext } from '../../types/context/index.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ShareKind } from '../../types/share/entry.js';
import { loadShareJsonFile, resolveShareJsonPath, saveShareJsonFile } from './io/shareJson.js';
import { normalizeWorkerBaseUrl } from '../policy/policy.js';

/** Removes one `share.json` row when the worker row is confirmed gone (404 / not-found codes only). */
export function purgeShareCacheEntry(input: {
  ctx: CoreContext;
  kind: ShareKind;
  workerId: string;
  workerBaseUrl: string;
}): { purged: boolean; issues: Issue[] } {
  const issues: Issue[] = [];
  const cache = input.ctx.cache;
  if (!cache?.state.enabled || !cache.runtime || cache.state.readOnly) {
    return { purged: false, issues };
  }

  const sharePath = resolveShareJsonPath(cache.state.projectDir, cache.runtime.path);
  const loaded = loadShareJsonFile({
    sharePath,
    runtime: cache.runtime,
    cacheReadOnly: cache.state.readOnly,
  });
  issues.push(...loaded.issues);

  const base = normalizeWorkerBaseUrl(input.workerBaseUrl);
  const before = loaded.file.entries.length;
  const entries = loaded.file.entries.filter((e) => {
    if (normalizeWorkerBaseUrl(e.workerBaseUrl) !== base) return true;
    if (input.kind === 'project') {
      return !(e.kind === 'project' && e.workerProjectId === input.workerId);
    }
    return !(e.kind === 'report' && e.workerReportId === input.workerId);
  });

  if (entries.length === before) {
    return { purged: false, issues };
  }

  const saved = saveShareJsonFile({ sharePath, runtime: cache.runtime, file: { version: 1, entries } });
  if (saved.warning) issues.push(saved.warning);
  return { purged: true, issues };
}
