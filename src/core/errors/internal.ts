import type { CliErrorCode } from '@/types/core/errors/index.js';

export class I18nPruneError extends Error {
  constructor(
    message: string,
    public readonly code: CliErrorCode,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'I18nPruneError';
  }
}
