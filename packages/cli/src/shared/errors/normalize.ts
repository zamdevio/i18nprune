import { ZodError } from 'zod';
import { isConfigValidationError } from '@i18nprune/core/config';
import type { NormalizedCliError, CliErrorCode } from '@i18nprune/core';

export function normalizeUnknownError(err: unknown): NormalizedCliError {
  if (isConfigValidationError(err)) {
    return { code: 'CONFIG_INVALID', message: err.message, cause: err };
  }
  if (err instanceof ZodError) {
    return { code: 'CONFIG_INVALID', message: err.message, cause: err };
  }
  if (err instanceof Error) {
    return { code: 'INTERNAL', message: err.message, cause: err };
  }
  return { code: 'INTERNAL', message: String(err), cause: err };
}

export function codeToExitCode(code: CliErrorCode): number {
  switch (code) {
    case 'USAGE':
      return 2;
    default:
      return 1;
  }
}
