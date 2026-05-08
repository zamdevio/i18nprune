import { I18nPruneError } from '@i18nprune/core';
import { normalizeUnknownError, codeToExitCode } from './normalize.js';
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
