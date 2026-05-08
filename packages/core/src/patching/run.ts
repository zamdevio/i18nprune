import type { PatchingResult, PatchingRunInput } from '../types/patching/index.js';
import { analyzePatchingState } from './analyze.js';
import { applyPatchPlanAtomic } from './apply.js';
import { buildPatchPlan } from './plan.js';

export async function runPatching(input: PatchingRunInput): Promise<PatchingResult> {
  const analysis = await analyzePatchingState(input);
  if (analysis.config.enabled && analysis.hasError) {
    const strict = analysis.config.mode === 'strict';
    return {
      ok: !strict,
      applied: false,
      skipped: true,
      recipe: analysis.config.recipe,
      action: input.action,
      changedFiles: [],
      skipReason: strict ? 'strict_mode_failure' : 'unsupported_pattern',
      diagnostics: analysis.diagnostics,
    };
  }
  const planned = await buildPatchPlan(input);
  if (!planned.ok) {
    const strict = planned.config.mode === 'strict';
    return {
      ok: !strict,
      applied: false,
      skipped: true,
      recipe: planned.config.recipe,
      action: input.action,
      changedFiles: [],
      skipReason: strict ? 'strict_mode_failure' : planned.skipReason,
      diagnostics: planned.diagnostics,
    };
  }
  const applied = await applyPatchPlanAtomic(input.runtime, planned.plan);
  if (!applied.ok) {
    const strict = planned.config.mode === 'strict';
    return {
      ok: !strict,
      applied: false,
      skipped: true,
      recipe: planned.plan.recipe,
      action: planned.plan.action,
      changedFiles: [],
      skipReason: strict ? 'strict_mode_failure' : 'apply_failed',
      diagnostics: [...planned.diagnostics, ...applied.diagnostics],
    };
  }
  return {
    ok: true,
    applied: true,
    skipped: false,
    recipe: planned.plan.recipe,
    action: planned.plan.action,
    changedFiles: applied.changedFiles,
    diagnostics: [...planned.diagnostics, ...applied.diagnostics],
  };
}
