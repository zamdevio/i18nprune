import type {
  PatchingDiagnostic,
  PatchingResult,
  PatchingRunInput,
  ResolvedPatchingConfig,
} from '../types/patching/index.js';
import { GENERATED_RECIPE_ID } from './constants.js';
import { resolvePatchingConfig } from './config.js';

const SUPPORTED_RECIPES = new Set<string>([GENERATED_RECIPE_ID]);

export async function detectPatchingRecipe(
  input: PatchingRunInput,
): Promise<
  { ok: true; config: ResolvedPatchingConfig; diagnostics: PatchingDiagnostic[] } | {
    ok: false;
    diagnostics: PatchingDiagnostic[];
    skipReason: PatchingResult['skipReason'];
    config: ResolvedPatchingConfig;
  }
> {
  const resolved = resolvePatchingConfig(input.config);
  if (!resolved.enabled) {
    return {
      ok: false,
      config: resolved,
      skipReason: 'disabled',
      diagnostics: [
        {
          severity: 'info',
          code: 'i18nprune.patching.disabled',
          message: 'patching: disabled by config',
          docPath: 'patching/README',
        },
      ],
    };
  }
  if (!SUPPORTED_RECIPES.has(resolved.recipe)) {
    return {
      ok: false,
      config: resolved,
      skipReason: 'unsupported_pattern',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.recipe_unsupported',
          message: `patching: unsupported recipe "${resolved.recipe}" (supported: ${GENERATED_RECIPE_ID})`,
          docPath: 'patching/README',
        },
      ],
    };
  }

  if (!resolved.configPath) {
    return {
      ok: false,
      config: resolved,
      skipReason: 'missing_path',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.path_missing',
          message: 'patching: configPath is required when patching.enabled=true',
          docPath: 'patching/README',
        },
      ],
    };
  }

  if (!resolved.loaderPath) {
    return {
      ok: false,
      config: resolved,
      skipReason: 'missing_path',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.path_missing',
          message: `patching: loaderPath is required for recipe ${GENERATED_RECIPE_ID} (path to loaders.generated.ts)`,
          docPath: 'patching/loader.md',
        },
      ],
    };
  }
  return { ok: true, config: resolved, diagnostics: [] };
}
