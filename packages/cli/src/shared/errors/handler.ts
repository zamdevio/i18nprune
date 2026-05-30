import { getRunOptions, I18nPruneError } from '@i18nprune/core';
import { ConfigValidationError, isConfigValidationError } from '@i18nprune/core/config';
import { resolveActiveCliCommandFromArgv } from '@/argv/index.js';
import { COMMANDS_WITH_JSON_OUTPUT } from '@/constants/jsonoutput.js';
import { emitCliJsonOptionError } from '@/shared/result/optionErrorEnvelope.js';
import { normalizeUnknownError, codeToExitCode } from './normalize.js';
import { logCliIssueGuidance } from './issueGuidance.js';
import { logger } from '@/utils/logger/index.js';

function tryEmitJsonCommandError(message: string, issueCode: string): boolean {
  if (!getRunOptions().json) return false;
  const command = resolveActiveCliCommandFromArgv();
  if (command === null || !COMMANDS_WITH_JSON_OUTPUT.has(command)) return false;
  return emitCliJsonOptionError({
    command,
    json: true,
    issueCode,
    message,
  });
}

function reportConfigValidationError(err: ConfigValidationError): number {
  if (err.issueCode && tryEmitJsonCommandError(err.message, err.issueCode)) {
    return codeToExitCode('CONFIG_INVALID');
  }
  logger.err(err.message);
  if (err.issueCode) logCliIssueGuidance(err.issueCode);
  return codeToExitCode('CONFIG_INVALID');
}

export function reportCliError(err: unknown): number {
  if (err instanceof I18nPruneError) {
    if (err.issueCode && tryEmitJsonCommandError(err.message, err.issueCode)) {
      return codeToExitCode(err.code);
    }
    logger.err(err.message);
    if (err.issueCode) logCliIssueGuidance(err.issueCode);
    return codeToExitCode(err.code);
  }
  if (isConfigValidationError(err)) {
    return reportConfigValidationError(err);
  }
  const n = normalizeUnknownError(err);
  logger.err(n.message);
  return codeToExitCode(n.code);
}
