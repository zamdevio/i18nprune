import type { LocalesFilesystemConfig } from '../../../config/schema/root.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { LocalesLayoutMode, LocalesLayoutStructure, ResolvedLocalesLayout } from '../../../types/locales/layout.js';

function defaultStructureForMode(mode: LocalesLayoutMode): LocalesLayoutStructure {
  return mode === 'flat_file' ? 'locale_file' : 'locale_per_dir';
}

export function resolveLocalesLayout(
  config: LocalesFilesystemConfig,
  directoryAbsolute: string,
): ResolvedLocalesLayout {
  const mode: LocalesLayoutMode = config.mode ?? 'flat_file';
  const structure: LocalesLayoutStructure = config.structure ?? defaultStructureForMode(mode);
  return { mode, structure, directoryAbsolute, config };
}

export function resolveLocalesLayoutFromContext(ctx: CoreContext): ResolvedLocalesLayout {
  return resolveLocalesLayout(ctx.config.locales, ctx.paths.localesDir);
}

export function isLocalesLayoutReadSupported(layout: ResolvedLocalesLayout): boolean {
  return (
    (layout.mode === 'flat_file' && layout.structure === 'locale_file') ||
    (layout.mode === 'locale_directory' &&
      (layout.structure === 'locale_per_dir' || layout.structure === 'feature_bundle'))
  );
}

export function isLocalesLayoutWriteSupported(layout: ResolvedLocalesLayout): boolean {
  return layout.mode === 'flat_file' && layout.structure === 'locale_file';
}
