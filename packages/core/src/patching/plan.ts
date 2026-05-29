import type {
  PatchingDiagnostic,
  PatchingPlan,
  PatchingResult,
  PatchingRunInput,
  ResolvedPatchingConfig,
} from '../types/patching/index.js';
import { computeGeneratedModuleImportBase, readFileSafe, readTextFileOrEmpty, resolveLocalesDir, resolvePatchingFilePath } from './io.js';
import { resolvePatchingLocaleImportSpec } from './localeDiscovery.js';
import { buildPlanFromGeneratedFiles } from './planGenerated.js';
import { detectPatchingRecipe } from './recipe.js';

export async function buildPatchPlan(
  input: PatchingRunInput,
): Promise<
  { ok: true; plan: PatchingPlan; diagnostics: PatchingDiagnostic[]; config: ResolvedPatchingConfig } | {
    ok: false;
    diagnostics: PatchingDiagnostic[];
    skipReason: PatchingResult['skipReason'];
    config: ResolvedPatchingConfig;
  }
> {
  const detected = await detectPatchingRecipe(input);
  if (!detected.ok) return detected;
  const resolved = detected.config;
  const root = input.projectRoot;
  const configAbs = resolvePatchingFilePath(input.runtime, root, resolved.configPath);
  const loaderAbs = resolvePatchingFilePath(input.runtime, root, resolved.loaderPath);

  const configRead = await readFileSafe(input.runtime, configAbs);
  if (!configRead.ok) {
    return { ok: false, config: resolved, skipReason: configRead.skipReason, diagnostics: configRead.diagnostics };
  }

  const generatedText = await readTextFileOrEmpty(input.runtime, loaderAbs);
  const combinedSize = configRead.content.length + generatedText.length;
  if (combinedSize > resolved.sizeLimitBytes) {
    return {
      ok: false,
      config: resolved,
      skipReason: 'too_large',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.file_too_large',
          message: `patching: file exceeds size limit (${String(resolved.sizeLimitBytes)} bytes)`,
          docPath: 'patching/README',
        },
      ],
    };
  }

  const planned = buildPlanFromGeneratedFiles({
    action: input.action,
    changedLocaleCodes: input.changedLocaleCodes,
    configPath: configAbs,
    configText: configRead.content,
    generatedPath: loaderAbs,
    generatedText,
    importBase: computeGeneratedModuleImportBase(input.runtime, resolved, root),
    sourceLocaleCode: input.sourceLocaleCode,
    upsertLocaleRecords: input.upsertLocaleRecords,
    localeImportSpec: resolvePatchingLocaleImportSpec({
      layout: input.localesLayout,
      runtime: input.runtime,
      localesDir: resolveLocalesDir(input.runtime, resolved, root),
      sourceLocaleCode: input.sourceLocaleCode ?? 'en',
    }),
  });
  if (!planned.ok) {
    return { ok: false, config: resolved, skipReason: planned.skipReason, diagnostics: planned.diagnostics };
  }
  if (planned.plan.edits.length === 0) {
    return {
      ok: false,
      config: resolved,
      skipReason: 'no_changes',
      diagnostics: [
        {
          severity: 'info',
          code: 'i18nprune.patching.no_changes',
            message: 'patching: no config/generated loader updates required',
          docPath: 'patching/README',
        },
      ],
    };
  }
  return {
    ok: true,
    config: resolved,
    plan: planned.plan,
    diagnostics: [...detected.diagnostics, ...planned.diagnostics],
  };
}
