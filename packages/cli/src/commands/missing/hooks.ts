import type { MissingHostHooks } from '@i18nprune/core';

import type { MissingRuntime } from '@/types/command/missing/index.js';

export function buildMissingHostHooks(runtime: MissingRuntime = {}): MissingHostHooks {
  return {
    emit: runtime.emit,
    runId: runtime.runId,
  };
}
