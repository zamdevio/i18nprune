import type { LocalesFilesystemConfig } from '../../../types/config/localesFilesystem.js';
import type { LocalesLayoutMode, LocalesLayoutStructure } from '../../../types/locales/layout.js';

export function localesMode(config: LocalesFilesystemConfig): LocalesLayoutMode {
  return config.mode ?? 'flat_file';
}

/** True when explicit `locales.structure` is required before read/write layout resolution. */
export function isLocalesStructureRequired(config: LocalesFilesystemConfig): boolean {
  return localesMode(config) === 'locale_directory' && config.structure === undefined;
}

export function resolveLocalesStructure(config: LocalesFilesystemConfig): LocalesLayoutStructure {
  if (config.structure !== undefined) {
    return config.structure;
  }
  if (localesMode(config) === 'flat_file') {
    return 'locale_file';
  }
  throw new Error('locales.structure is required when locales.mode is locale_directory');
}
