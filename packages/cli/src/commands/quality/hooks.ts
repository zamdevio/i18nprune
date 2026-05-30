import type { QualityHostHooks } from '@i18nprune/core';

import type { QualityRuntime } from '@/types/command/quality/index.js';

export function buildQualityHostHooks(runtime: QualityRuntime = {}): QualityHostHooks {
  return {
    emit: runtime.emit,
    runId: runtime.runId,
    listLimit: runtime.listLimit,
  };
}
