import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ConfigValidationError } from '@i18nprune/core/config';
import { ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE } from '@i18nprune/core/shared/constants/issueCodes.js';
import { resetRunOptions, setRunOptions } from '@i18nprune/core';
import { reportCliError } from '../handler.js';

describe('reportCliError', () => {
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    resetRunOptions();
    setRunOptions({ json: false, quiet: false, silent: false });
    errSpy.mockClear();
    warnSpy.mockClear();
  });

  afterEach(() => {
    errSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('prints issue doc line after ConfigValidationError when issueCode is set', () => {
    const code = ISSUE_PROJECT_LOCALES_SOURCE_NOT_LANGUAGE_CODE;
    const err = new ConfigValidationError('locales.source is bad', undefined, code);
    reportCliError(err);
    expect(errSpy).toHaveBeenCalled();
    const warnText = warnSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(warnText).toContain(`issue: ${code}`);
    expect(warnText).toContain('docs');
  });
});
