import type { ReviewHostHooks } from '@i18nprune/core';

import type { ReviewRuntime } from '@/types/command/review/index.js';

export function buildReviewHostHooks(runtime: ReviewRuntime = {}): ReviewHostHooks {
  return {
    emit: runtime.emit,
    runId: runtime.runId,
  };
}
