import type { ReviewHostHooks } from '@i18nprune/core';

import { resolveDynamicSitesCount } from '@/shared/cache/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { ReviewRuntime } from '@/types/command/review/index.js';

export function buildReviewHostHooks(ctx: Context, runtime: ReviewRuntime = {}): ReviewHostHooks {
  return {
    emit: runtime.emit,
    runId: runtime.runId,
    getDynamicSitesCount: () => resolveDynamicSitesCount(ctx),
  };
}
