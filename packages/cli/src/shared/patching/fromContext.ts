import { analyzePatchingState, runPatching } from '@i18nprune/core';
import type {
  PatchingAnalyzeOutput,
  PatchingResult,
  PatchingRunInput,
} from '@i18nprune/core';
import { getDisplaySourceLocaleCode } from '@/shared/locales/index.js';
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
): Pick<PatchingRunInput, 'sourceLocaleCode' | 'config' | 'runtime' | 'projectRoot'> {
  return {
    sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
    config: ctx.config.patching,
    runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
    projectRoot: resolvePatchingProjectRoot(ctx),
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
