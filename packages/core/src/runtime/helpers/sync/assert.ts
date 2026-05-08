import { I18nPruneError } from '../../../shared/errors/internal.js';

export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

export function assertSyncPortResult<T>(value: T | Promise<T>, label: string, at: string): T {
  if (isThenable(value)) {
    throw new I18nPruneError(
      `Synchronous ${label} requires a plain value (got a Promise at ${at})`,
      'USAGE',
    );
  }
  return value;
}
