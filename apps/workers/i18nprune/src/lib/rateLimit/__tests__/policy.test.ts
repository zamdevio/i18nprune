import { describe, expect, it } from 'vitest';
import { uploadRateLimitDecision } from '../policy.js';

describe('uploadRateLimitDecision', () => {
  it('allows uploads within hourly and daily quotas', () => {
    expect(uploadRateLimitDecision({ hour: 20, day: 100 }, { perHour: 20, perDay: 100 })).toEqual({
      allowed: true,
    });
  });

  it('blocks when hourly quota exceeded', () => {
    expect(uploadRateLimitDecision({ hour: 21, day: 1 }, { perHour: 20, perDay: 100 })).toEqual({
      allowed: false,
      retryAfterSeconds: 3600,
    });
  });

  it('blocks when daily quota exceeded', () => {
    expect(uploadRateLimitDecision({ hour: 1, day: 101 }, { perHour: 20, perDay: 100 })).toEqual({
      allowed: false,
      retryAfterSeconds: 86_400,
    });
  });
});
