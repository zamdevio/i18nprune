import { resolveShareInputFilesEpoch } from '../share/cache/resolveInputFilesEpoch.js';
import type { CoreContext } from '../types/context/index.js';
import type { ProjectAnalysis } from '../types/analysis/index.js';
import type { HostPrepareCacheMeta } from '../types/project/metadata.js';
import { METADATA_DASH } from '../types/project/metadata.js';
import type { ProjectPrepareMeta } from '../types/project/prepare.js';

/** Host-side cache snapshot for worker metadata (`extraction.cache`). */
export function buildHostPrepareCacheMeta(
  ctx: CoreContext,
  analysis: ProjectAnalysis,
  prepareMeta?: ProjectPrepareMeta,
): HostPrepareCacheMeta {
  const dispatch = analysis.cache;
  const projectCacheEnabled = ctx.cache?.state.enabled === true;
  const analysisStatus = dispatch?.status ?? (projectCacheEnabled ? 'miss' : 'disabled');
  const analysisReason =
    dispatch?.reason ?? (projectCacheEnabled ? 'producer_succeeded' : 'no_cache');
  const filesEpoch = resolveShareInputFilesEpoch(ctx);

  const analysisMs = prepareMeta?.analysisMs;
  const totalMs = prepareMeta?.totalMs;
  const fastPrepare =
    typeof totalMs === 'number' && Number.isFinite(totalMs) && totalMs < 2000;
  const zeroAnalysisMs = typeof analysisMs === 'number' && analysisMs <= 0;
  const timingsTrustworthy = analysisStatus !== 'hit' || (!zeroAnalysisMs && !fastPrepare);

  return {
    analysis: analysisStatus,
    analysisReason,
    timingsTrustworthy,
    filesEpoch: filesEpoch ?? METADATA_DASH,
    projectCacheEnabled,
  };
}
