/**
 * Minimal path surface for computing {@link LocaleSegmentSource} without importing a concrete runtime.
 */
export type LocaleLeafPathApi = {
  basename(path: string, suffix?: string): string;
  dirname(path: string): string;
  join(...paths: string[]): string;
  relative(from: string, to: string): string;
  isAbsolute(path: string): boolean;
};

/**
 * On-disk locale JSON segment that contributed a normalized translation row.
 *
 * @remarks Distinct from {@link TranslationSurfaceLeaf.catalogSource} (structured JSON metadata on disk).
 */
export type LocaleSegmentSource = {
  file: string;
  locale: string;
  relativePath: string;
};

/** @deprecated Use {@link LocaleSegmentSource}. */
export type LocaleLeafFileOrigin = LocaleSegmentSource;
