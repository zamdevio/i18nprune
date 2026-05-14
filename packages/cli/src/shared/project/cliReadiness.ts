import { runProjectReadiness } from '@i18nprune/core';
import type { Issue, ProjectReadinessRequest } from '@i18nprune/core';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import type { Context } from '@/types/core/context/index.js';

/**
 * Runs core {@link runProjectReadiness} on the resolved CLI context and merges discovery warnings.
 * @returns `null` when all checks pass; otherwise the merged **`issues[]`** to attach to an envelope or summary.
 */
export function cliReadinessIssues(ctx: Context, request: ProjectReadinessRequest): Issue[] | null {
  const out = runProjectReadiness(createCliCoreContext(ctx), request);
  if (out.ok) return null;
  return mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), out.issues);
}
