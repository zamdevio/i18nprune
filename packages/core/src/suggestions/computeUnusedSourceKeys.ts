import { computeCleanupCandidateKeys } from '../cleanup/candidates.js';
import { readCleanupSourceLeaves } from '../cleanup/sourceSurface.js';
import { buildKeyReferenceContextFromLiteralUsageAndDynamicSites } from '../shared/reference/context.js';
import { resolveReferenceConfig } from '../shared/reference/resolveConfig.js';
import type { ProjectAnalysis } from '../types/analysis/index.js';
import type { CoreContext } from '../types/context/index.js';

export type UnusedSourceKeysResult = {
  candidates: string[];
  count: number;
};

/**
 * Unused source-locale key paths after scan + preserve + uncertain-prefix rules.
 * Matches cleanup candidate logic without string-presence probes (cheap).
 */
export function computeUnusedSourceKeys(ctx: CoreContext, analysis: ProjectAnalysis): UnusedSourceKeysResult {
  const eff = resolveReferenceConfig('cleanup', ctx.config);
  const refCtx = buildKeyReferenceContextFromLiteralUsageAndDynamicSites(
    analysis.usage,
    analysis.dynamicSites,
    eff,
  );
  const leaves = readCleanupSourceLeaves(ctx);
  const filterUncertain = eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
  const { candidates } = computeCleanupCandidateKeys({
    leaves,
    usage: analysis.usage,
    preserve: ctx.config.policies?.preserve,
    uncertainPrefixes: refCtx.uncertainPrefixes,
    filterUncertainPrefixes: filterUncertain,
  });
  return { candidates, count: candidates.length };
}
