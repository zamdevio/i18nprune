import type { CliErrorCode } from '../../types/errors/index.js';

export class I18nPruneError extends Error {
  public readonly code: CliErrorCode;
  public readonly issueCode?: string;

  constructor(
    message: string,
    code: CliErrorCode,
    options?: { cause?: unknown; issueCode?: string },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'I18nPruneError';
    this.code = code;
    this.issueCode = options?.issueCode;
  }
}
