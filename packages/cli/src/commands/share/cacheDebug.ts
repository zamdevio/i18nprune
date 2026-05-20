import {
  emitShareCacheDebug,
  emitShareJsonHealHumanMessages,
  resolveShareJsonPath,
  type ShareHumanMessageHost,
  type ShareListResult,
} from '@i18nprune/core';
import type { CoreContext } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';

export function emitShareListCacheDebug(
  ctx: Context,
  coreCtx: CoreContext,
  listed: ShareListResult,
  entryCount: number,
  runHost: ShareHumanMessageHost,
): void {
  if (listed.heal.backupBakPath || listed.heal.repaired) {
    emitShareJsonHealHumanMessages(runHost, listed.heal);
  }
  if (!ctx.run.debugCache) return;
  const cache = coreCtx.cache;
  const sharePath =
    cache?.state.enabled && cache.runtime
      ? resolveShareJsonPath(cache.state.projectDir, cache.runtime.path)
      : '(share.json cache disabled)';
  emitShareCacheDebug({
    emit: runHost.emit,
    runId: runHost.runId,
    enabled: true,
    lines: [
      {
        level: 'info',
        message:
          cache?.state.enabled === false
            ? 'share.json cache disabled (--no-cache or config)'
            : `share.json: ${sharePath}`,
      },
      { level: 'detail', message: `  entries: ${String(entryCount)}` },
      ...(listed.heal.backupBakPath
        ? [{ level: 'detail' as const, message: `  backup: ${listed.heal.backupBakPath}` }]
        : []),
    ],
  });
}
