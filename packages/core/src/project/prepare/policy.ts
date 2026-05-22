import type { CoreContext } from '../../types/context/index.js';
import type { PrepareHostKind, PrepareHostPolicy } from '../../types/project/prepareHost.js';

/** Maps prepare host to whether `resolveProjectAnalysis` may use project cache. */
export function resolvePrepareHostPolicy(
  ctx: CoreContext,
  prepareHost: PrepareHostKind,
): PrepareHostPolicy {
  const useAnalysisCache = prepareHost === 'cli-share' && ctx.cache?.state.enabled === true;
  return { prepareHost, useAnalysisCache };
}
