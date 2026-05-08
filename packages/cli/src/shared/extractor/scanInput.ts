import type { CoreEngineRuntime } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';
import type { ExtractorProjectScanInput } from '@/types/shared/extractor/index.js';

/** Map CLI context to core extractor project-scan input. */
export function toExtractorScanInput(ctx: Context): ExtractorProjectScanInput {
  const { fs, path, system } = ctx.adapters;
  const runtime: CoreEngineRuntime = { fs, path, system };
  return {
    srcRoot: ctx.paths.srcRoot,
    functions: ctx.config.functions,
    runtime,
    exclude: ctx.config.exclude,
  };
}
