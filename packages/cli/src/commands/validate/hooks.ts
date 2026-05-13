import type { ValidateHostHooks } from '@i18nprune/core';

import type { ValidateRuntime } from '@/types/command/validate/index.js';

export function buildValidateHostHooks(runtime: ValidateRuntime = {}): ValidateHostHooks {
  return {
    emit: runtime.emit,
    runId: runtime.runId,
  };
}
