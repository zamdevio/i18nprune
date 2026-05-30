import { describe, expect, it } from 'vitest';
import { ConfigValidationError, defineConfig } from '../index.js';
import { ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE } from '../../shared/constants/issueCodes.js';

describe('defineConfig', () => {
  it('throws ConfigValidationError with issueCode for invalid locales.source', () => {
    expect(() =>
      defineConfig({
        locales: { source: 'en.json', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      }),
    ).toThrow(ConfigValidationError);

    try {
      defineConfig({
        locales: { source: 'en.json', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      const e = err as ConfigValidationError;
      expect(e.issueCode).toBe(ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE);
      expect(e.message).toContain('en.json');
    }
  });
});
