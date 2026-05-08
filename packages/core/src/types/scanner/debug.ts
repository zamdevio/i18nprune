/**
 * Structured scan-walk debug events (directory / file skips while listing sources).
 *
 * Core does not print these — it only invokes an optional listener so hosts stay
 * runtime-agnostic (no `console` in core). Register via {@link RunOptions.onScanDebug}
 * or pass `onScanDebug` to {@link listSourceFiles}.
 */
export type ScanDebugSkipDirectoryEvent = {
  kind: 'skip_directory';
  /** Path relative to scan root (POSIX separators). */
  relativePath: string;
  /** Directory entry basename. */
  basename: string;
  /** Human-readable reason (built-in skip, `exclude.dirs`, regex, …). */
  reason: string;
};

export type ScanDebugSkipFileEvent = {
  kind: 'skip_file';
  relativePath: string;
  basename: string;
  reason: string;
};

export type ScanDebugEvent = ScanDebugSkipDirectoryEvent | ScanDebugSkipFileEvent;

/** Optional per-call listener for {@link listSourceFiles} (overrides global when both set: per-call wins). */
export type ListSourceFilesOptions = {
  onScanDebug?: (event: ScanDebugEvent) => void;
};
