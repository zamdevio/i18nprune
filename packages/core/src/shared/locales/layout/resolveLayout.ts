import type { LocalesFilesystemConfig } from '../../../config/schema/root.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { LocalesLayoutMode, LocalesLayoutStructure, ResolvedLocalesLayout } from '../../../types/locales/layout.js';

function defaultStructureForMode(mode: LocalesLayoutMode): LocalesLayoutStructure {
  return mode === 'flat_file' ? 'locale_file' : 'locale_per_dir';
}

/**
 * Apply schema defaults for optional `mode` / `structure` and bind the absolute bundle root.
 */
export function resolveLocalesLayout(
  config: LocalesFilesystemConfig,
  directoryAbsolute: string,
): ResolvedLocalesLayout {
  const mode: LocalesLayoutMode = config.mode ?? 'flat_file';
  const structure: LocalesLayoutStructure = config.structure ?? defaultStructureForMode(mode);
  return {
    mode,
    structure,
    directoryAbsolute,
    config,
  };
}

/** {@link resolveLocalesLayout} using {@link CoreContext.config.locales} and {@link CoreContext.paths.localesDir}. */
export function resolveLocalesLayoutFromContext(ctx: CoreContext): ResolvedLocalesLayout {
  return resolveLocalesLayout(ctx.config.locales, ctx.paths.localesDir);
}

/** True when the shared bundle reader/writer can handle this layout today (Phase 1: flat file only). */
export function isLocalesLayoutSupported(layout: ResolvedLocalesLayout): boolean {
  return layout.mode === 'flat_file' && layout.structure === 'locale_file';
}
