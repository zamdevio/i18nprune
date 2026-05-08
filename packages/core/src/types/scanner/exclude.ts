/** Single user rule for directory or file basename, or an extension token (see `ScanExcludeConfig.extensions`). */
export type ScanExcludeRule = string | RegExp;

/** Built-in presets for scan exclusion defaults. */
export type ScanExcludePreset = 'production';

/**
 * Optional scan exclusions (directories while walking, files, extensions, path patterns).
 * Used by {@link listSourceFiles} and extractor project scans. Omitted fields mean “no extra rule”.
 *
 * `useDefaultSkip` defaults to **true** when `exclude` is absent or the field is omitted — built-in
 * directory skips (e.g. `node_modules`, `dist`) stay on unless explicitly disabled.
 *
 * **Validation:** empty string rules are ignored. **`RegExp`** values are used as-is; a bad pattern can
 * still throw when the walk runs (same as any invalid regex in app code). There is no silent disk I/O
 * or scan-tree warning channel in core — hosts that want UX warnings should validate config before calling.
 */
export type ScanExcludeConfig = {
  /**
   * Optional built-in preset. At resolve time, preset `dirs` / `files` / `extensions` / `patterns` are merged **before**
   * the same fields from this config object (preset first, then your lists). **`useDefaultSkip`** uses your value when set,
   * otherwise the preset’s. **CLI** may append `--exclude` directory names after load.
   */
  preset?: ScanExcludePreset;
  /** Skip directory entries with this basename while recursing (string equality or `RegExp.test(name)`). */
  dirs?: ScanExcludeRule[];
  /** After a path matches a scanned source extension, skip if basename matches. */
  files?: ScanExcludeRule[];
  /**
   * Skip if any suffix of the basename after the first dot matches (e.g. `d.ts`, `ts`, `stories.tsx`).
   * Strings are normalized: trimmed, lowercased, leading `.` stripped. Regexes are tested on each suffix.
   */
  extensions?: ScanExcludeRule[];
  /** Skip when the path relative to the scan root (POSIX `/`) matches any regex. */
  patterns?: RegExp[];
  /**
   * When true (default), apply built-in directory skips in addition to `dirs`.
   * When false, only `dirs` / `files` / `extensions` / `patterns` apply.
   */
  useDefaultSkip?: boolean;
};
