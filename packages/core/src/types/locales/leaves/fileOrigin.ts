/**
 * Minimal path surface for computing {@link LocaleLeafFileOrigin} without importing a concrete runtime.
 *
 * @remarks Implementations are typically `node:path` or host-injected adapters.
 */
export type LocaleLeafPathApi = {
  basename(path: string, suffix?: string): string;
  dirname(path: string): string;
  join(...paths: string[]): string;
  relative(from: string, to: string): string;
  isAbsolute(path: string): boolean;
};

/**
 * Physical locale JSON segment that contributed a logical translation row (on-disk provenance).
 *
 * @remarks Distinct from the optional string field `source` on translation surface rows: that field is
 * structured-locale JSON metadata (`manual`, catalog id, …). `fileOrigin` maps logical keys back to on-disk
 * segment files for multi-file topologies and extension navigation.
 */
export type LocaleLeafFileOrigin = {
  /** Absolute path to the locale JSON file that was walked. */
  file: string;
  /** Locale code (basename without `.json`). */
  locale: string;
  /**
   * Path relative to the configured locales root, POSIX-style (`en.json`, `en/auth.json`, …).
   * Falls back to the basename when the file is not under `localesDir`.
   */
  relativePath: string;
};
