import { describe, expect, it } from 'vitest';
import { createProviderHealthMonitor } from '../providerHealth.js';

describe('createProviderHealthMonitor', () => {
  describe('counter behavior', () => {
    it('reports 0 backoffs and 0 delay for an unseen provider', () => {
      const m = createProviderHealthMonitor();
      expect(m.consecutiveBackoffsFor('google')).toBe(0);
      expect(m.shouldDelayStartFor('google')).toBe(0);
    });

    it('increments the counter on every non-success outcome', () => {
      const m = createProviderHealthMonitor({ now: () => 1_000 });
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      m.onAttemptResult({ providerId: 'google', outcome: 'transient_network' });
      m.onAttemptResult({ providerId: 'google', outcome: 'provider_unavailable' });
      expect(m.consecutiveBackoffsFor('google')).toBe(3);
    });

    it('resets the counter on success', () => {
      const m = createProviderHealthMonitor({ now: () => 1_000 });
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      expect(m.consecutiveBackoffsFor('google')).toBe(2);
      m.onAttemptResult({ providerId: 'google', outcome: 'success' });
      expect(m.consecutiveBackoffsFor('google')).toBe(0);
    });

    it('keeps per-provider counters independent', () => {
      const m = createProviderHealthMonitor({ now: () => 1_000 });
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      m.onAttemptResult({ providerId: 'mymemory', outcome: 'transient_network' });
      m.onAttemptResult({ providerId: 'mymemory', outcome: 'transient_network' });
      expect(m.consecutiveBackoffsFor('google')).toBe(1);
      expect(m.consecutiveBackoffsFor('mymemory')).toBe(2);
    });
  });

  describe('Retry-After hint', () => {
    it('extends shouldDelayStartFor by retryAfterMs', () => {
      let nowMs = 10_000;
      const m = createProviderHealthMonitor({ now: () => nowMs });
      m.onAttemptResult({
        providerId: 'google',
        outcome: 'rate_limited',
        hint: { retryAfterMs: 5_000 },
      });
      expect(m.shouldDelayStartFor('google')).toBe(5_000);
      nowMs += 2_000;
      expect(m.shouldDelayStartFor('google')).toBe(3_000);
      nowMs += 5_000;
      expect(m.shouldDelayStartFor('google')).toBe(0);
    });

    it('uses max(existing, new) when stacking deadlines', () => {
      let nowMs = 0;
      const m = createProviderHealthMonitor({ now: () => nowMs });
      m.onAttemptResult({
        providerId: 'google',
        outcome: 'rate_limited',
        hint: { retryAfterMs: 10_000 },
      });
      m.onAttemptResult({
        providerId: 'google',
        outcome: 'rate_limited',
        hint: { retryAfterMs: 1_000 },
      });
      expect(m.shouldDelayStartFor('google')).toBe(10_000);
    });

    it('ignores zero or negative retryAfterMs', () => {
      const m = createProviderHealthMonitor({ now: () => 0, fallbackBackoffMs: [] });
      m.onAttemptResult({
        providerId: 'google',
        outcome: 'rate_limited',
        hint: { retryAfterMs: 0 },
      });
      expect(m.shouldDelayStartFor('google')).toBe(0);
    });
  });

  describe('exponential fallback', () => {
    it('uses fallback[count - 1] when no hint is supplied', () => {
      const m = createProviderHealthMonitor({
        now: () => 0,
        fallbackBackoffMs: [100, 200, 400],
      });
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      expect(m.shouldDelayStartFor('google')).toBe(100);
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      expect(m.shouldDelayStartFor('google')).toBe(200);
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      expect(m.shouldDelayStartFor('google')).toBe(400);
    });

    it('clamps fallback to the last bucket once exhausted', () => {
      const m = createProviderHealthMonitor({
        now: () => 0,
        fallbackBackoffMs: [100, 200, 400],
      });
      for (let i = 0; i < 10; i += 1) {
        m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      }
      expect(m.shouldDelayStartFor('google')).toBe(400);
    });

    it('skips fallback when caller provides an empty fallback array', () => {
      const m = createProviderHealthMonitor({ now: () => 0, fallbackBackoffMs: [] });
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      expect(m.shouldDelayStartFor('google')).toBe(0);
      expect(m.consecutiveBackoffsFor('google')).toBe(1);
    });

    it('honors hint over fallback for the same attempt', () => {
      const m = createProviderHealthMonitor({
        now: () => 0,
        fallbackBackoffMs: [9_999_999],
      });
      m.onAttemptResult({
        providerId: 'google',
        outcome: 'rate_limited',
        hint: { retryAfterMs: 100 },
      });
      expect(m.shouldDelayStartFor('google')).toBe(100);
    });
  });

  describe('shouldEscalate', () => {
    it('returns false until consecutive backoffs reach the threshold', () => {
      const m = createProviderHealthMonitor({ now: () => 0 });
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      expect(m.shouldEscalate('google', { maxBackoffsBeforeEscalate: 3 })).toBe(false);
      m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      expect(m.shouldEscalate('google', { maxBackoffsBeforeEscalate: 3 })).toBe(true);
    });

    it('reports false again after a success resets the counter', () => {
      const m = createProviderHealthMonitor({ now: () => 0 });
      for (let i = 0; i < 5; i += 1) {
        m.onAttemptResult({ providerId: 'google', outcome: 'rate_limited' });
      }
      expect(m.shouldEscalate('google', { maxBackoffsBeforeEscalate: 3 })).toBe(true);
      m.onAttemptResult({ providerId: 'google', outcome: 'success' });
      expect(m.shouldEscalate('google', { maxBackoffsBeforeEscalate: 3 })).toBe(false);
    });
  });
});
