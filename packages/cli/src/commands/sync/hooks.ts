import { emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEvent, SyncHostHooks } from '@i18nprune/core';

import type { SyncRuntime } from '@/types/command/sync/index.js';

export function buildSyncHostHooks(runtime: SyncRuntime): SyncHostHooks {
  const { emit, runId } = runtime;
  const emitProgress = (
    e: Omit<Extract<RunEvent, { type: 'run.progress.sync' }>, 'op' | 'runId' | 'at'>,
  ): void => {
    emitRunEvent(emit, { op: 'sync', runId, at: nowMs(), ...e });
  };

  return {
    emit,
    runId,
    emitProgress,
  };
}
