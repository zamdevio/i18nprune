import { ZodError } from 'zod';
import { ConfigValidationError } from '@/config/schema.js';
import type { NormalizedCliError, CliErrorCode } from '@/types/core/errors/index.js';

export function normalizeUnknownError(err: unknown): NormalizedCliError {
  if (err instanceof ConfigValidationError) {
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
