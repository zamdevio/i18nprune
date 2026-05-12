import { projectReportDocumentSchema } from '@i18nprune/report';
import { getOrBuildCachedProjectData } from '@i18nprune/core';
import { buildCliCacheRuntime } from './runtime.js';
import type { Context } from '@/types/core/context/index.js';
import type { ProjectReportDocument } from '@/types/command/report/index.js';
import type { ProjectReportCacheResult } from '@/types/shared/cache/index.js';

export function getOrBuildProjectReportWithCache(
  ctx: Context,
  producer: () => ProjectReportDocument,
): ProjectReportCacheResult {
  const out = getOrBuildCachedProjectData<ProjectReportDocument>({
    state: ctx.meta.cache,
    runtime: buildCliCacheRuntime(ctx.adapters),
    sourceLocalePath: ctx.paths.sourceLocale,
    srcRoot: ctx.paths.srcRoot,
    exclude: ctx.config.exclude,
    producer,
    parseCachedData: (data) => {
      const parsed = projectReportDocumentSchema.safeParse(data);
      return parsed.success ? { ok: true, data: parsed.data as ProjectReportDocument } : { ok: false };
    },
  });
  return {
    document: out.data,
    cache: out.cache,
  };
}
