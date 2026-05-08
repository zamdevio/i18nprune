import { describe, expect, it } from 'vitest';
import { classifyTranslateFailure } from '../classify.js';

describe('classifyTranslateFailure', () => {
  it('classifies MyMemory daily cap as quota_exceeded', () => {
    const err = new Error(
      'HTTP 429: MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY. NEXT AVAILABLE IN  01 HOURS 00 MINUTES 00 SECONDS',
    );
    expect(classifyTranslateFailure(err)).toBe('quota_exceeded');
  });

  it('classifies generic 429 as rate_limited', () => {
    expect(classifyTranslateFailure(new Error('HTTP 429 too many requests'))).toBe('rate_limited');
  });

  it('classifies errno network failures as transient_network', () => {
    const err = new Error('fetch failed');
    (err as unknown as { code?: string }).code = 'ECONNRESET';
    expect(classifyTranslateFailure(err)).toBe('transient_network');
  });

  it('classifies auth failures', () => {
    expect(classifyTranslateFailure(new Error('HTTP 401 unauthorized'))).toBe('auth_failure');
  });
});
