export type ExportErrorCode =
  | 'unknown_ref'
  | 'invalid_range'
  | 'barrel_missing'
  | 'usage'
  | 'validate_failed';

export class ExportError extends Error {
  readonly code: ExportErrorCode;
  readonly exitCode: number;
  readonly details: Record<string, string | number | string[] | undefined>;

  constructor(
    message: string,
    code: ExportErrorCode,
    options: {
      exitCode?: number;
      details?: Record<string, string | number | string[] | undefined>;
    } = {},
  ) {
    super(message);
    this.name = 'ExportError';
    this.code = code;
    this.exitCode = options.exitCode ?? 1;
    this.details = options.details ?? {};
  }
}

export function isExportError(err: unknown): err is ExportError {
  return err instanceof ExportError;
}
