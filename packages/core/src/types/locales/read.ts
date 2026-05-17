/** Severity for {@link LocaleReadDiagnostic} (hosts map to log level / UI). */
export type LocaleReadDiagnosticLevel = 'info' | 'warn' | 'error';

/**
 * Structured locale I/O signal from the shared locale reader layer (no `console.*` in core).
 *
 * @remarks Hosts (CLI, extension) subscribe via `onDiagnostic` or inspect `diagnostics[]` on results.
 */
export type LocaleReadDiagnostic = {
  level: LocaleReadDiagnosticLevel;
  /** Stable machine id for filtering (not a CLI `--json` issue code unless wired explicitly). */
  code: string;
  message: string;
  path?: string;
};
