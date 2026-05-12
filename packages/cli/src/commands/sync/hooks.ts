import { emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEvent, SyncHostHooks } from '@i18nprune/core';
import type { DynamicKeySite, KeyObservation } from '@i18nprune/core/types';

import { resolveProjectReportData } from '@/shared/cache/reportData.js';
import type { Context } from '@/types/core/context/index.js';
import type { SyncRuntime } from '@/types/command/sync/index.js';

export function buildSyncHostHooks(ctx: Context, runtime: SyncRuntime): SyncHostHooks {
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
    loadReferenceData: () => {
      const { document } = resolveProjectReportData(ctx);
      return {
        keyObservations: document.details.keyObservations as KeyObservation[],
        dynamicSites: document.details.dynamicSites as DynamicKeySite[],
      };
    },
  };
}
