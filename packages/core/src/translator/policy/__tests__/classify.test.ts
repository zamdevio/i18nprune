import { describe, expect, it } from 'vitest';
import { classifyTranslateFailure } from '../classify.js';

describe('classifyTranslateFailure', () => {
  describe('rate-limit family', () => {
    it('classifies MyMemory daily cap as quota_exceeded', () => {
      const err = new Error(
        'HTTP 429: MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY. NEXT AVAILABLE IN  01 HOURS 00 MINUTES 00 SECONDS',
      );
      expect(classifyTranslateFailure(err)).toBe('quota_exceeded');
    });

    it('classifies generic 429 as rate_limited', () => {
      expect(classifyTranslateFailure(new Error('HTTP 429 too many requests'))).toBe('rate_limited');
    });

    it('classifies "too many requests" prose without a status as rate_limited', () => {
      expect(classifyTranslateFailure(new Error('Too Many Requests, please slow down'))).toBe('rate_limited');
    });
  });

  describe('auth_failure', () => {
    it('matches HTTP 401', () => {
      expect(classifyTranslateFailure(new Error('HTTP 401 unauthorized'))).toBe('auth_failure');
    });

    it('matches HTTP 403', () => {
      expect(classifyTranslateFailure(new Error('DeepL HTTP 403: forbidden'))).toBe('auth_failure');
    });

    it('matches "unauthorized" without a status', () => {
      expect(classifyTranslateFailure(new Error('Unauthorized: invalid api key'))).toBe('auth_failure');
    });
  });

  describe('transient_network', () => {
    it('classifies ECONNRESET as transient_network', () => {
      const err = new Error('socket hang up');
      (err as unknown as { code?: string }).code = 'ECONNRESET';
      expect(classifyTranslateFailure(err)).toBe('transient_network');
    });

    it('classifies ECONNREFUSED as transient_network', () => {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:443');
      (err as unknown as { code?: string }).code = 'ECONNREFUSED';
      expect(classifyTranslateFailure(err)).toBe('transient_network');
    });

    it('classifies generic "fetch failed" as transient_network', () => {
      expect(classifyTranslateFailure(new TypeError('fetch failed'))).toBe('transient_network');
    });

    it('classifies generic /network/ messages as transient_network', () => {
      expect(classifyTranslateFailure(new Error('Network error: peer closed'))).toBe('transient_network');
    });
  });

  describe('provider_unavailable', () => {
    it('classifies HTTP 503 as provider_unavailable', () => {
      expect(classifyTranslateFailure(new Error('LibreTranslate HTTP 503'))).toBe('provider_unavailable');
    });

    it('classifies HTTP 502 as provider_unavailable', () => {
      expect(classifyTranslateFailure(new Error('Bad gateway: HTTP 502'))).toBe('provider_unavailable');
    });

    it('classifies "service unavailable" prose as provider_unavailable', () => {
      expect(classifyTranslateFailure(new Error('Service Unavailable, retry later'))).toBe('provider_unavailable');
    });
  });

  describe('malformed_response', () => {
    it('classifies "invalid json" as malformed_response', () => {
      expect(classifyTranslateFailure(new Error('Invalid JSON in provider response'))).toBe('malformed_response');
    });

    it('classifies "unexpected token" parse errors as malformed_response', () => {
      expect(classifyTranslateFailure(new SyntaxError('Unexpected token < in JSON at position 0'))).toBe(
        'malformed_response',
      );
    });

    it('classifies "malformed" prose as malformed_response', () => {
      expect(classifyTranslateFailure(new Error('malformed response body'))).toBe('malformed_response');
    });
  });

  describe('unknown_hard_stop', () => {
    it('classifies unrecognized errors as unknown_hard_stop', () => {
      expect(classifyTranslateFailure(new Error('something went sideways'))).toBe('unknown_hard_stop');
    });

    it('classifies non-Error throwables as unknown_hard_stop', () => {
      expect(classifyTranslateFailure('boom')).toBe('unknown_hard_stop');
      expect(classifyTranslateFailure(undefined)).toBe('unknown_hard_stop');
      expect(classifyTranslateFailure({ weird: true })).toBe('unknown_hard_stop');
    });
  });

  describe('branch ordering', () => {
    it('prefers rate_limited over auth_failure when both signals appear', () => {
      expect(classifyTranslateFailure(new Error('HTTP 429 (after 401 retry)'))).toBe('rate_limited');
    });

    it('prefers auth_failure over transient_network when both signals appear', () => {
      const err = new Error('HTTP 403 forbidden after network reset');
      (err as unknown as { code?: string }).code = 'ECONNRESET';
      expect(classifyTranslateFailure(err)).toBe('auth_failure');
    });

    it('prefers transient_network over provider_unavailable for errno-tagged 5xx', () => {
      const err = new Error('HTTP 503 service unavailable');
      (err as unknown as { code?: string }).code = 'ECONNRESET';
      expect(classifyTranslateFailure(err)).toBe('transient_network');
    });
  });
});
