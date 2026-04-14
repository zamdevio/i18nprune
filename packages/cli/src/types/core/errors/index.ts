export type CliErrorCode =
  | 'CONFIG_INVALID'
  | 'CONFIG_MISSING'
  | 'IO'
  | 'VALIDATION'
  | 'TRANSLATE'
  | 'USAGE'
  | 'INTERNAL';

export type NormalizedCliError = {
  code: CliErrorCode;
  message: string;
  cause?: unknown;
};
