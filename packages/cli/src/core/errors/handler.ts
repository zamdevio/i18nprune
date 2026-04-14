import { I18nPruneError } from '@/core/errors/internal.js';
import { normalizeUnknownError, codeToExitCode } from '@/core/errors/normalize.js';
import { logger } from '@/utils/logger/index.js';

export function reportCliError(err: unknown): number {
  if (err instanceof I18nPruneError) {
    logger.err(err.message);
    return codeToExitCode(err.code);
  }
  const n = normalizeUnknownError(err);
  logger.err(n.message);
  return codeToExitCode(n.code);
}
