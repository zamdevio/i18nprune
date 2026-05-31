import { runProjectReadiness } from '@i18nprune/core';
import type { Issue, ProjectReadinessRequest } from '@i18nprune/core';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import { logger } from '@/utils/logger/index.js';
import type { Context } from '@/types/core/context/index.js';

/**
 * Runs core {@link runProjectReadiness} on the resolved CLI context and merges discovery warnings.
 * Logs readiness **warnings** (e.g. source locale missing segment files) and **errors** to stderr;
 * issue doc links are emitted once via {@link printCommandSummary} (not here). Returns **`null`**
 * when no **error**-severity issues remain (warnings alone do not block).
 */
export function cliReadinessIssues(ctx: Context, request: ProjectReadinessRequest): Issue[] | null {
  const out = runProjectReadiness(createCliCoreContext(ctx), request);
  const merged = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), out.issues);
  const blocking = merged.filter((i) => i.severity === 'error');
  if (!ctx.run.json) {
    for (const issue of merged) {
      if (issue.severity === 'warning') {
        logger.warn(issue.message, ctx.run);
      }
    }
    for (const issue of blocking) {
      logger.err(issue.message);
    }
  }
  return blocking.length > 0 ? merged : null;
}
