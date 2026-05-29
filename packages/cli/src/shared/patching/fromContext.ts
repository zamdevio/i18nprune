import { analyzePatchingState, resolveLocalesLayout, runPatching, sourceLocaleCodeForLayout } from '@i18nprune/core';
import type {
  PatchingAnalyzeOutput,
  PatchingResult,
  PatchingRunInput,
} from '@i18nprune/core';
import { resolvePatchingProjectRoot } from '@/shared/patching/scaffoldI18nLayout.js';
import type { Context } from '@/types/core/context/index.js';

export type PatchingRunInputFromContextParams = Pick<
  PatchingRunInput,
  'command' | 'action' | 'changedLocaleCodes'
> &
  Partial<Pick<PatchingRunInput, 'upsertLocaleRecords' | 'treatAsPatchRequested'>>;

/**
 * Shared **`runPatching` / `analyzePatchingState`** wiring from **`Context`** so **`patch`** and **`--patch`**
 * mutation hooks stay aligned on **`sourceLocaleCode`**, **`config`**, **`runtime`**, and **`projectRoot`**.
 */
export function patchingRunInputBaseFromContext(
  ctx: Context,
): Pick<PatchingRunInput, 'sourceLocaleCode' | 'config' | 'runtime' | 'projectRoot' | 'localesLayout'> {
  const localesLayout = resolveLocalesLayout(ctx.config.locales, ctx.paths.localesDir);
  return {
    sourceLocaleCode: sourceLocaleCodeForLayout({
      layout: localesLayout,
      path: ctx.adapters.path,
      sourceLocaleAbsolute: ctx.paths.sourceLocale,
    }),
    config: ctx.config.patching,
    runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
    projectRoot: resolvePatchingProjectRoot(ctx),
    localesLayout,
  };
}

export async function runPatchingFromContext(
  ctx: Context,
  params: PatchingRunInputFromContextParams,
): Promise<PatchingResult> {
  return runPatching({ ...patchingRunInputBaseFromContext(ctx), ...params });
}

export async function analyzePatchingStateFromContext(
  ctx: Context,
  params: PatchingRunInputFromContextParams,
): Promise<PatchingAnalyzeOutput> {
  return analyzePatchingState({ ...patchingRunInputBaseFromContext(ctx), ...params });
}
