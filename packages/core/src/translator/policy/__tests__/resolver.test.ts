import { describe, expect, it } from 'vitest';
import {
  policyKeyForOutcome,
  resolveProviderActionFor,
  type ResolveProviderActionInput,
} from '../resolver.js';
import type { TranslateFailureOutcome } from '../classify.js';
import { TRANSLATE_POLICY_DEFAULTS } from '../../../types/translator/policy.js';
import type { TranslatePolicy } from '../../../types/translator/policy.js';
import { createProviderHealthMonitor } from '../../../shared/translator/utils/providerHealth.js';

const PROVIDER = 'google';

/**
 * Resolved policy as the resolver would see it post-parse: {@link TRANSLATE_POLICY_DEFAULTS}
 * plus `maxAttempts: 3` (a realistic 3-provider chain). Tests that need different attempt
 * budgets pass `maxAttempts` explicitly via overrides.
 */
function makePolicy(overrides: Partial<TranslatePolicy> = {}): TranslatePolicy {
  return { ...TRANSLATE_POLICY_DEFAULTS, maxAttempts: 3, ...overrides };
}

function callResolver(
  partial: Partial<ResolveProviderActionInput> & Pick<ResolveProviderActionInput, 'outcome'>,
): ReturnType<typeof resolveProviderActionFor> {
  const health = partial.health ?? createProviderHealthMonitor();
  return resolveProviderActionFor({
    providerId: PROVIDER,
    policy: makePolicy(),
    health,
    ...partial,
  });
}

describe('policyKeyForOutcome', () => {
  it('maps every classifier outcome to a key (or undefined for hard-stop)', () => {
    expect(policyKeyForOutcome('rate_limited')).toBe('onRateLimit');
    expect(policyKeyForOutcome('transient_network')).toBe('onTransientFailure');
    expect(policyKeyForOutcome('quota_exceeded')).toBe('onQuotaExceeded');
    expect(policyKeyForOutcome('auth_failure')).toBe('onAuthFailure');
    expect(policyKeyForOutcome('provider_unavailable')).toBe('onProviderUnavailable');
    expect(policyKeyForOutcome('malformed_response')).toBe('onProviderUnavailable');
    expect(policyKeyForOutcome('unknown_hard_stop')).toBeUndefined();
  });
});

describe('resolveProviderActionFor — defaults', () => {
  it('rate_limited at default policy → backoff (no escalation on first attempt)', () => {
    const action = callResolver({ outcome: 'rate_limited' });
    expect(action.verb).toBe('backoff');
    expect(action.escalatedFrom).toBeUndefined();
    expect(action.reason).toBe('policy.onRateLimit=backoff');
  });

  it('transient_network at default policy → retry', () => {
    const action = callResolver({ outcome: 'transient_network' });
    expect(action.verb).toBe('retry');
    expect(action.reason).toBe('policy.onTransientFailure=retry');
  });

  it('quota_exceeded at default policy → fallback', () => {
    expect(callResolver({ outcome: 'quota_exceeded' }).verb).toBe('fallback');
  });

  it('auth_failure at default policy → abort', () => {
    expect(callResolver({ outcome: 'auth_failure' }).verb).toBe('abort');
  });

  it('provider_unavailable at default policy → fallback', () => {
    expect(callResolver({ outcome: 'provider_unavailable' }).verb).toBe('fallback');
  });

  it('malformed_response at default policy → fallback (shares onProviderUnavailable)', () => {
    expect(callResolver({ outcome: 'malformed_response' }).verb).toBe('fallback');
  });

  it('unknown_hard_stop always aborts regardless of policy', () => {
    const action = callResolver({
      outcome: 'unknown_hard_stop',
      policy: makePolicy({
        // no policy key consults this outcome
      }),
    });
    expect(action.verb).toBe('abort');
    expect(action.reason).toBe('unknown_hard_stop_always_aborts');
  });
});

describe('resolveProviderActionFor — non-default policies', () => {
  it('honors onRateLimit=retry (no health bookkeeping)', () => {
    const health = createProviderHealthMonitor();
    callResolver({
      outcome: 'rate_limited',
      policy: makePolicy({ onRateLimit: 'retry' }),
      health,
    });
    expect(health.consecutiveBackoffsFor(PROVIDER)).toBe(0);
  });

  it('honors onAuthFailure=prompt', () => {
    expect(
      callResolver({
        outcome: 'auth_failure',
        policy: makePolicy({ onAuthFailure: 'prompt' }),
      }).verb,
    ).toBe('prompt');
  });

  it('honors onTransientFailure=fallback', () => {
    expect(
      callResolver({
        outcome: 'transient_network',
        policy: makePolicy({ onTransientFailure: 'fallback' }),
      }).verb,
    ).toBe('fallback');
  });

  it('honors onProviderUnavailable=abort even for malformed_response', () => {
    expect(
      callResolver({
        outcome: 'malformed_response',
        policy: makePolicy({ onProviderUnavailable: 'abort' }),
      }).verb,
    ).toBe('abort');
  });
});

describe('resolveProviderActionFor — backoff escalation', () => {
  it('first backoff stays as backoff when threshold > 1', () => {
    const health = createProviderHealthMonitor();
    const action = callResolver({
      outcome: 'rate_limited',
      policy: makePolicy({ maxAttempts: 3 }),
      health,
    });
    expect(action.verb).toBe('backoff');
    expect(action.escalatedFrom).toBeUndefined();
    expect(health.consecutiveBackoffsFor(PROVIDER)).toBe(1);
  });

  it('escalates to fallback after maxAttempts consecutive backoffs', () => {
    const health = createProviderHealthMonitor();
    const policy = makePolicy({ maxAttempts: 2 });
    const first = callResolver({ outcome: 'rate_limited', policy, health });
    expect(first.verb).toBe('backoff');
    const second = callResolver({ outcome: 'rate_limited', policy, health });
    expect(second.verb).toBe('fallback');
    expect(second.escalatedFrom).toBe('backoff');
    expect(second.reason).toBe('escalated_after_backoff_streak>=2');
  });

  it('escalates immediately when maxAttempts is 1 (default for one-provider setups)', () => {
    const health = createProviderHealthMonitor();
    const action = callResolver({
      outcome: 'rate_limited',
      policy: makePolicy({ maxAttempts: 1 }),
      health,
    });
    expect(action.verb).toBe('fallback');
    expect(action.escalatedFrom).toBe('backoff');
  });

  it('clamps maxAttempts undefined to 1', () => {
    const health = createProviderHealthMonitor();
    const action = callResolver({
      outcome: 'rate_limited',
      policy: makePolicy({ maxAttempts: undefined }),
      health,
    });
    expect(action.verb).toBe('fallback');
    expect(action.reason).toBe('escalated_after_backoff_streak>=1');
  });

  it('forwards Retry-After hint to the health monitor only on backoff', () => {
    const health = createProviderHealthMonitor({ now: () => 1_000 });
    callResolver({
      outcome: 'rate_limited',
      policy: makePolicy({ maxAttempts: 5 }),
      health,
      hint: { retryAfterMs: 7_500 },
    });
    expect(health.shouldDelayStartFor(PROVIDER)).toBeGreaterThanOrEqual(7_500);
  });

  it('does not forward hint when verb is not backoff', () => {
    const health = createProviderHealthMonitor();
    callResolver({
      outcome: 'rate_limited',
      policy: makePolicy({ onRateLimit: 'retry' }),
      health,
      hint: { retryAfterMs: 7_500 },
    });
    expect(health.shouldDelayStartFor(PROVIDER)).toBe(0);
    expect(health.consecutiveBackoffsFor(PROVIDER)).toBe(0);
  });

  it('honors explicit escalationThreshold over policy.maxAttempts', () => {
    const health = createProviderHealthMonitor();
    const policy = makePolicy({ maxAttempts: 10 });
    const first = callResolver({ outcome: 'rate_limited', policy, health, escalationThreshold: 1 });
    expect(first.verb).toBe('fallback');
    expect(first.escalatedFrom).toBe('backoff');
    expect(first.reason).toBe('escalated_after_backoff_streak>=1');
  });

  it('escalationThreshold derived from chain length per plan §7 (3 providers, maxAttempts=3 → threshold=1)', () => {
    const health = createProviderHealthMonitor();
    const policy = makePolicy({ maxAttempts: 3 });
    // Caller computes ceil(3 / 3) = 1
    const action = callResolver({
      outcome: 'rate_limited',
      policy,
      health,
      escalationThreshold: 1,
    });
    expect(action.verb).toBe('fallback');
    expect(action.escalatedFrom).toBe('backoff');
  });

  it('isolates streaks per providerId', () => {
    const health = createProviderHealthMonitor();
    const policy = makePolicy({ maxAttempts: 2 });
    callResolver({ outcome: 'rate_limited', policy, health, providerId: 'google' });
    const action = callResolver({
      outcome: 'rate_limited',
      policy,
      health,
      providerId: 'mymemory',
    });
    expect(action.verb).toBe('backoff');
    expect(action.escalatedFrom).toBeUndefined();
  });
});

describe('resolveProviderActionFor — diagnostic reasons', () => {
  it('reason field is stable for non-escalated default verbs', () => {
    const cases = [
      { outcome: 'transient_network' as const, expected: 'policy.onTransientFailure=retry' },
      { outcome: 'quota_exceeded' as const, expected: 'policy.onQuotaExceeded=fallback' },
      { outcome: 'auth_failure' as const, expected: 'policy.onAuthFailure=abort' },
      { outcome: 'provider_unavailable' as const, expected: 'policy.onProviderUnavailable=fallback' },
    ];
    for (const c of cases) {
      expect(callResolver({ outcome: c.outcome }).reason).toBe(c.expected);
    }
  });
});

/** Step 9 — one assertion per classifier outcome at default merged policy (`makePolicy`). */
describe('resolveProviderActionFor — default policy verb matrix', () => {
  const cases: Array<{ outcome: TranslateFailureOutcome; verb: 'backoff' | 'retry' | 'fallback' | 'abort' }> = [
    { outcome: 'rate_limited', verb: 'backoff' },
    { outcome: 'transient_network', verb: 'retry' },
    { outcome: 'quota_exceeded', verb: 'fallback' },
    { outcome: 'auth_failure', verb: 'abort' },
    { outcome: 'provider_unavailable', verb: 'fallback' },
    { outcome: 'malformed_response', verb: 'fallback' },
    { outcome: 'unknown_hard_stop', verb: 'abort' },
  ];
  it.each(cases)('$outcome → $verb', ({ outcome, verb }) => {
    expect(callResolver({ outcome }).verb).toBe(verb);
  });
});
