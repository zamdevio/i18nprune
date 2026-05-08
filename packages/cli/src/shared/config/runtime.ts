import { buildPatchingSectionIncompleteDiagnostic, resolveMissingLeafPlaceholder } from '@i18nprune/core';
import type { I18nPruneConfig } from '@i18nprune/core/config';

/**
 * Normalize fragile config fields after load (warnings only; does not throw).
 * Mutates **`outWarnings`** with **`config.missing:`** / **`config.patching:`** prefixes where relevant.
 */
export function normalizeConfigRuntimeFields(config: I18nPruneConfig, outWarnings: string[]): I18nPruneConfig {
  let next = config;

  const missing = config.missing;
  if (missing?.placeholder !== undefined) {
    const { placeholder, warnings } = resolveMissingLeafPlaceholder(missing.placeholder);
    for (const w of warnings) outWarnings.push(`config.missing: ${w}`);
    if (warnings.length > 0) {
      next = { ...next, missing: { ...missing, placeholder } };
    }
  }

  return next;
}

/**
 * When **`--patch`** is set but the **`patching`** block cannot run (**`configPath`** / **`loaderPath`**),
 * do not flip **`patching.enabled`**; record a warning instead.
 */
export function shouldSuppressPatchEnableFromCli(config: I18nPruneConfig): boolean {
  const d = buildPatchingSectionIncompleteDiagnostic(config.patching, { effectiveWantsRun: true });
  return d !== null;
}

export function buildCliPatchSuppressedWarning(config: I18nPruneConfig): string {
  const d = buildPatchingSectionIncompleteDiagnostic(config.patching, { effectiveWantsRun: true });
  return d?.message ?? 'patching: --patch ignored (incomplete patching config).';
}
