import type { LocalesFilesystemConfig } from './root.js';
import type { LocalesLayoutMode, LocalesLayoutStructure } from '../../types/locales/layout.js';

function defaultStructureForMode(mode: LocalesLayoutMode): LocalesLayoutStructure {
  return mode === 'flat_file' ? 'locale_file' : 'locale_per_dir';
}

/**
 * Soft compatibility checks for `locales.mode` + `locales.structure` (warn only — does not block parse).
 *
 * @remarks Prefer this over zod `.superRefine` when the config should still load; hosts log warnings via
 * `normalizeConfigRuntimeFields` (CLI) or equivalent.
 */
export function collectLocalesFilesystemConfigWarnings(locales: LocalesFilesystemConfig): string[] {
  const warnings: string[] = [];
  const mode: LocalesLayoutMode = locales.mode ?? 'flat_file';
  const structure: LocalesLayoutStructure = locales.structure ?? defaultStructureForMode(mode);

  if (mode === 'flat_file' && structure !== 'locale_file') {
    warnings.push(
      `locales.structure "${structure}" does not apply when locales.mode is "flat_file"; use "locale_file" or set mode to "locale_directory".`,
    );
  }

  if (mode === 'locale_directory' && structure === 'locale_file') {
    warnings.push(
      `locales.structure "locale_file" does not apply when locales.mode is "locale_directory"; use "locale_per_dir" or "feature_bundle".`,
    );
  }

  return warnings;
}
