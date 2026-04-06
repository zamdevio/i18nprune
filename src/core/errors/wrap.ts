import { I18nPruneError } from '@/core/errors/internal.js';

export function rethrowAsI18n(err: unknown, message: string): never {
  if (err instanceof I18nPruneError) throw err;
  throw new I18nPruneError(message, 'INTERNAL', { cause: err });
}
