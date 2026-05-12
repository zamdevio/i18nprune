import { extractor } from '@i18nprune/core';
import type { CleanupHostHooks } from '@i18nprune/core';
import type { DynamicKeySite, KeyObservation } from '@i18nprune/core/types';

import { resolveProjectReportData } from '@/shared/cache/reportData.js';
import { isRipgrepAvailable, rgFixedStringSearch, rgFixedStringSearchLocations } from '@/utils/rg/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { CleanupRuntime } from '@/types/command/cleanup/index.js';

export function buildCleanupHostHooks(ctx: Context, runtime: CleanupRuntime = {}): CleanupHostHooks {
  return {
    emit: runtime.emit,
    runId: runtime.runId,
    loadReferenceData: () => {
      const { document } = resolveProjectReportData(ctx);
      const observations = document.details.keyObservations as KeyObservation[];
      return {
        usage: extractor.keySites.literalKeyUsageFromObservations(observations),
        dynamicSites: document.details.dynamicSites as DynamicKeySite[],
      };
    },
    isStringPresenceAvailable: () => isRipgrepAvailable(),
    hasStringPresence: (sample) => rgFixedStringSearch(ctx.paths.srcRoot, sample),
    getStringPresenceLocations: (sample, maxHits) =>
      rgFixedStringSearchLocations(ctx.paths.srcRoot, sample, maxHits).map((h) => `${h.path}:${String(h.line)}`),
  };
}
