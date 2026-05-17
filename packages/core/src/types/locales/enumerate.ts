import type { LocaleReadDiagnostic } from './read.js';

/**
 * One on-disk JSON segment that contributes to a logical locale (bundle root–relative paths).
 *
 * @remarks `relativePath` uses POSIX `/` separators. For `locale_file`, this is typically `en.json`;
 * for `locale_per_dir`, `en/auth.json`; for `feature_bundle`, `auth/en.json`.
 */
export type LocaleSegmentRef = {
  /** BCP-47-ish locale code inferred from layout rules. */
  locale: string;
  /** Path relative to {@link ResolvedLocalesLayout.directoryAbsolute}. */
  relativePath: string;
  /** Absolute path to the segment JSON file. */
  absolutePath: string;
};

export type ListLocaleSegmentsResult = {
  segments: LocaleSegmentRef[];
  diagnostics: LocaleReadDiagnostic[];
};

export type ListLocaleCodesResult = {
  codes: string[];
  diagnostics: LocaleReadDiagnostic[];
};
