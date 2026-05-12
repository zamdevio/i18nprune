import { ISSUE_PATCHING_CONFIG_SECTION_INCOMPLETE } from '../shared/constants/issueCodes.js';
import type { PatchingConfigInput, PatchingDiagnostic } from '../types/patching/index.js';
import { resolvePatchingConfig } from './config.js';

function patchingBlockPresent(config: PatchingConfigInput | undefined): boolean {
  return config !== undefined && typeof config === 'object' && Object.keys(config).length > 0;
}

/**
 * Warn when a **`patching`** object is present (or a run is about to treat patching as active)
 * but **`loader_generated`** cannot run because required path fields are empty.
 */
export function buildPatchingSectionIncompleteDiagnostic(
  config: PatchingConfigInput | undefined,
  opts: { effectiveWantsRun: boolean },
): PatchingDiagnostic | null {
  if (!opts.effectiveWantsRun) return null;
  if (!patchingBlockPresent(config)) return null;
  const r = resolvePatchingConfig(config);
  if (r.enabled) {
    return null;
  }
  const missing: string[] = [];
  if (!r.configPath.trim()) missing.push('configPath');
  if (!r.loaderPath.trim()) missing.push('loaderPath');
  if (missing.length === 0) return null;
  return {
    severity: 'warn',
    code: ISSUE_PATCHING_CONFIG_SECTION_INCOMPLETE,
    message: `patching: config lists a patching block but required field(s) are empty: ${missing.join(', ')}. Set them (see i18nprune patch --init) before using --patch, or patch analyze/fix.`,
    docPath: 'issues/patching',
  };
}

export { patchingBlockPresent };
