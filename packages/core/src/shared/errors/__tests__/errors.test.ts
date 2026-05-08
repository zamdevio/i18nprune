import { describe, expect, it } from 'vitest';
import { I18nPruneError, rethrowAsI18n } from '../index.js';

describe('core errors', () => {
  it('creates typed i18nprune error', () => {
    const err = new I18nPruneError('bad input', 'USAGE');
    expect(err.code).toBe('USAGE');
    expect(err.name).toBe('I18nPruneError');
  });

  it('wraps unknown errors as INTERNAL', () => {
    try {
      rethrowAsI18n(new Error('boom'), 'wrapped');
    } catch (err) {
      expect(err).toBeInstanceOf(I18nPruneError);
      expect((err as I18nPruneError).code).toBe('INTERNAL');
      expect((err as I18nPruneError).message).toBe('wrapped: boom');
    }
  });
});
