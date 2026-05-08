import { I18nPruneError } from './internal.js';
import { normalizeUnknownError } from './normalize.js';

export function rethrowAsI18n(err: unknown, message: string): never {
  if (err instanceof I18nPruneError) throw err;
  throw normalizeUnknownError(err, { when: message, defaultCode: 'INTERNAL' });
}
