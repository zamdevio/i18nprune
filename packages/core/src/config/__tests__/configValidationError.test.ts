import { describe, expect, it } from 'vitest';
import { ConfigValidationError, isConfigValidationError } from '../index.js';
import { ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE } from '../../shared/constants/issueCodes.js';

describe('isConfigValidationError', () => {
  it('matches real instances and cross-bundle name + issueCode', () => {
    const real = new ConfigValidationError('x', undefined, ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE);
    expect(isConfigValidationError(real)).toBe(true);

    const foreign = Object.assign(new Error('x'), {
      name: 'ConfigValidationError',
      issueCode: ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE,
    });
    expect(isConfigValidationError(foreign)).toBe(true);
    expect(isConfigValidationError(new Error('x'))).toBe(false);
  });
});
