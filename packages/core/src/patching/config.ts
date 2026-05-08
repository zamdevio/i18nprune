import type { PatchingConfigInput, ResolvedPatchingConfig } from '../types/patching/index.js';
import {
  DEFAULT_PATCHING_MODE,
  DEFAULT_PATCHING_RECIPE,
  DEFAULT_PATCHING_SIZE_LIMIT_BYTES,
} from './constants.js';

export function resolvePatchingConfig(input?: PatchingConfigInput): ResolvedPatchingConfig {
  return {
    enabled: input?.enabled === true,
    recipe: input?.recipe ?? DEFAULT_PATCHING_RECIPE,
    loaderPath: input?.loaderPath ?? '',
    configPath: input?.configPath ?? '',
    localeJsonImportBase: (input?.localeJsonImportBase ?? 'locales').replace(/\\/g, '/'),
    sizeLimitBytes:
      typeof input?.sizeLimitBytes === 'number' && Number.isFinite(input.sizeLimitBytes) && input.sizeLimitBytes > 0
        ? input.sizeLimitBytes
        : DEFAULT_PATCHING_SIZE_LIMIT_BYTES,
    mode: input?.mode ?? DEFAULT_PATCHING_MODE,
  };
}
