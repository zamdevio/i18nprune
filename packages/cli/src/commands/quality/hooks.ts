import type { QualityHostHooks } from '@i18nprune/core';

import { resolveDynamicSitesCount } from '@/shared/cache/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { QualityRuntime } from '@/types/command/quality/index.js';

export function buildQualityHostHooks(ctx: Context, runtime: QualityRuntime = {}): QualityHostHooks {
  return {
    emit: runtime.emit,
    runId: runtime.runId,
    getDynamicSitesCount: () => resolveDynamicSitesCount(ctx),
  };
}
