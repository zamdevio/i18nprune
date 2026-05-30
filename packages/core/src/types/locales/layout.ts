import type { LocalesFilesystemConfig } from '../config/localesFilesystem.js';

/** Resolved filesystem layout for locale bundle I/O (after defaults). */
export type LocalesLayoutMode = NonNullable<LocalesFilesystemConfig['mode']>;
export type LocalesLayoutStructure = NonNullable<LocalesFilesystemConfig['structure']>;

/**
 * Normalized layout descriptor passed to {@link readLocaleBundle} / {@link writeLocaleBundle}.
 *
 * @remarks `directoryAbsolute` is the configured bundle root (`paths.localesDir` on core context).
 */
export type ResolvedLocalesLayout = {
  mode: LocalesLayoutMode;
  structure: LocalesLayoutStructure;
  directoryAbsolute: string;
  config: LocalesFilesystemConfig;
};
