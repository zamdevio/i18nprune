import type { LocalesFilesystemConfig } from '../config/schema/root.js';
import type { LocalesLayoutMode, LocalesLayoutStructure } from '../types/locales/layout.js';
import type { CachedLocalesLayout } from '../types/cache/index.js';

/** Fingerprint stored in `files.json` — config-relative paths only. */
export function resolveCachedLocalesLayout(
  locales: LocalesFilesystemConfig,
): CachedLocalesLayout {
  return {
    mode: locales.mode ?? 'flat_file',
    structure: locales.structure ?? 'locale_file',
    directory: locales.directory,
    source: locales.source,
  };
}

export function layoutMatches(a: CachedLocalesLayout | undefined, b: CachedLocalesLayout): boolean {
  if (a === undefined) return false;
  return a.mode === b.mode && a.structure === b.structure && a.directory === b.directory && a.source === b.source;
}

export type { LocalesLayoutMode, LocalesLayoutStructure };
