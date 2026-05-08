import type { parseSyncLangSelection } from '../locales/targets.js';

/** Normalized `sync --target` selection (same as {@link parseSyncLangSelection}). */
export type SyncLangSelection = ReturnType<typeof parseSyncLangSelection>;

/**
 * Decide which locale JSON files sync should touch, and which requested codes have no file yet.
 * Pure: no I/O. Caller runs {@link assertNotSourceTargetLocale} for each code when `mode === 'codes'`.
 *
 * @param localeJsonBasenames — Every `*.json` basename in `localesDir` (e.g. `en.json`, `fr.json`).
 * @param sourceJsonBasename — Source-of-truth file basename (e.g. `en.json`).
 */
export function resolveSyncTargetFiles(input: {
  localeJsonBasenames: readonly string[];
  sourceJsonBasename: string;
  selection: SyncLangSelection;
}): { targetFiles: string[]; missingLocaleCodes: string[] } {
  const { localeJsonBasenames, sourceJsonBasename, selection } = input;
  const allNonSource = localeJsonBasenames.filter((f) => f !== sourceJsonBasename);
  if (selection.mode === 'all') {
    return { targetFiles: [...allNonSource], missingLocaleCodes: [] };
  }
  const codes = selection.codes;
  const missingLocaleCodes = codes.filter((c) => !allNonSource.includes(`${c}.json`));
  const targetFiles = codes.map((c) => `${c}.json`).filter((f) => allNonSource.includes(f));
  return { targetFiles, missingLocaleCodes };
}
