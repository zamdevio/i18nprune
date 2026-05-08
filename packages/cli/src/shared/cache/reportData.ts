import { buildProjectReportDocument } from '@/commands/report/build.js';
import type { Context } from '@/types/core/context/index.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import { getOrBuildProjectReportWithCache } from './dispatch.js';

export function resolveProjectReportData(ctx: Context): { document: ProjectReportDocument; fromCache: boolean } {
  const out = getOrBuildProjectReportWithCache(ctx, () => buildProjectReportDocument(ctx));
  for (const warn of out.cache.warnings) {
    ctx.meta.warnings.push(`cache: ${warn.message}`);
  }
  return { document: out.document, fromCache: out.cache.status === 'hit' };
}

/** Rebuild/refresh cached project report after mutating commands write files. */
export function refreshProjectReportCache(ctx: Context): void {
  const out = getOrBuildProjectReportWithCache(ctx, () => buildProjectReportDocument(ctx));
  for (const warn of out.cache.warnings) {
    ctx.meta.warnings.push(`cache: ${warn.message}`);
  }
}
