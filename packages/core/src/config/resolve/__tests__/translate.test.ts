import { describe, expect, it } from 'vitest';
import { resolveTranslateConfig } from '../translate.js';

describe('resolveTranslateConfig', () => {
  it('uses defaults when translate config is omitted', () => {
    const out = resolveTranslateConfig({ config: undefined, env: {} });
    expect(out.resolved.effectiveProviderId).toBe('google');
    expect(out.resolved.providerOrder).toEqual(['google']);
    expect(out.resolved.routing).toBe('single');
    expect(out.resolved.requestedWorkers).toBe(1);
    expect(out.resolved.effectiveWorkers).toBe(1);
    expect(out.warnings.length).toBeGreaterThan(0);
  });

  it('builds auto provider order and dedupes rows', () => {
    const out = resolveTranslateConfig({
      config: {
        primary: 'mymemory',
        providers: [{ id: 'google' }, { id: 'mymemory' }, { id: 'deepl' }, { id: 'deepl' }],
        policy: { routing: 'auto' },
      },
      env: {},
    });
    expect(out.resolved.providerOrder).toEqual(['mymemory', 'google', 'deepl']);
  });

  it('applies provider and worker pin precedence', () => {
    const out = resolveTranslateConfig({
      config: {
        primary: 'google',
        providers: [{ id: 'google' }, { id: 'deepl', rateLimit: { maxConcurrency: 2 } }],
        workers: 8,
      },
      env: { I18NPRUNE_TRANSLATE_MAX_WORKERS: '10' },
      pin: { providerId: 'deepl', workers: 5 },
    });
    expect(out.resolved.effectiveProviderId).toBe('deepl');
    expect(out.resolved.requestedWorkers).toBe(5);
    expect(out.resolved.effectiveWorkers).toBe(2);
    expect(out.warnings.some((w) => w.message.includes('capped workers'))).toBe(true);
  });

  it('merges provider default profile with row override', () => {
    const out = resolveTranslateConfig({
      config: {
        primary: 'mymemory',
        providers: [{ id: 'mymemory', rateLimit: { rps: 1.5 } }],
      },
      env: {},
    });
    expect(out.resolved.providers.mymemory.profile).toEqual({
      maxConcurrency: 2,
      rpm: 60,
      rps: 1.5,
      intervalMs: 1000,
    });
    expect(out.resolved.providers.mymemory.startRateLimit).toEqual({
      rpm: 60,
      rps: 1.5,
      intervalMs: 1000,
    });
  });
});
