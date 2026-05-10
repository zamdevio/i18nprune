import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock resolveTranslator from the providers registry so `runTranslate` uses our fakes instead
// of dispatching to the real Google/MyMemory/etc. providers. Mocks must be declared with literal
// module paths matching the import shape inside `run.ts`.
vi.mock('../../shared/translator/providers/registry.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../shared/translator/providers/registry.js')
  >('../../shared/translator/providers/registry.js');
  return {
    ...actual,
    resolveTranslator: vi.fn(),
  };
});

import { runTranslate } from '../run.js';
import { createTranslateContext } from '../context.js';
import { resolveTranslator } from '../../shared/translator/providers/registry.js';
import {
  ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR,
  ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING,
} from '../../shared/constants/issueCodes.js';
import type { Translator } from '../../types/translator/index.js';
import type { TranslateConfigInput } from '../../types/config/index.js';

const resolveTranslatorMock = vi.mocked(resolveTranslator);

function fakeTranslator(impl: (text: string) => string | Promise<string>): Translator {
  return {
    async translate(text) {
      return await impl(text);
    },
  };
}

const baseConfig: TranslateConfigInput = {
  primary: 'google',
  providers: [{ id: 'google' }],
};

function makeCtx(config: TranslateConfigInput = baseConfig) {
  return createTranslateContext({
    config,
    adapters: {} as never,
    env: {},
  });
}

describe('runTranslate', () => {
  beforeEach(() => {
    resolveTranslatorMock.mockReset();
  });

  it('translates plain texts in input order and aggregates stats', async () => {
    resolveTranslatorMock.mockReturnValue(fakeTranslator((t) => `${t}-fr`));

    const out = await runTranslate(makeCtx(), {
      texts: ['hello', 'world'],
      targetLang: 'fr',
    });

    expect(out.translations).toHaveLength(2);
    expect(out.translations[0]).toMatchObject({ ok: true, value: 'hello-fr', providerId: 'google' });
    expect(out.translations[1]).toMatchObject({ ok: true, value: 'world-fr', providerId: 'google' });
    expect(out.winnerProviderId).toBe('google');
    expect(out.fallbackCount).toBe(0);
    expect(out.translateStats.successfulLeaves).toBe(2);
    expect(out.providerAttempts).toHaveLength(1);
    expect(out.providerAttempts[0]).toMatchObject({ providerId: 'google', outcome: 'success' });
  });

  it('skips whitespace-only sources without calling the provider', async () => {
    const provider = vi.fn(fakeTranslator((t) => `${t}-fr`).translate);
    resolveTranslatorMock.mockReturnValue({ translate: provider });

    const out = await runTranslate(makeCtx(), {
      leaves: [
        { key: 'a', source: 'hi' },
        { key: 'b', source: '   ' },
        { key: 'c', source: 'world' },
      ],
      targetLang: 'fr',
    });

    expect(provider).toHaveBeenCalledTimes(2);
    expect(out.translations[1]).toEqual({ ok: false, key: 'b', reason: 'skipped', sourceValue: '   ' });
    expect(out.translations[0]).toMatchObject({ ok: true, key: 'a', value: 'hi-fr' });
    expect(out.translations[2]).toMatchObject({ ok: true, key: 'c', value: 'world-fr' });
  });

  it('falls back to the next provider when the first reports a retryable failure', async () => {
    resolveTranslatorMock
      .mockReturnValueOnce(
        fakeTranslator(() => {
          const e = new Error('fetch failed');
          (e as unknown as { code?: string }).code = 'ECONNRESET';
          throw e;
        }),
      )
      .mockReturnValueOnce(fakeTranslator((t) => `${t}-de`));

    const cfg: TranslateConfigInput = {
      primary: 'google',
      providers: [{ id: 'google' }, { id: 'mymemory' }],
      policy: { routing: 'auto' },
    };
    const out = await runTranslate(makeCtx(cfg), {
      texts: ['ok'],
      targetLang: 'de',
    });

    expect(out.providerAttempts.map((a) => a.providerId)).toEqual(['google', 'mymemory']);
    expect(out.providerAttempts[0]?.outcome).toBe('network_error');
    expect(out.providerAttempts[1]?.outcome).toBe('success');
    expect(out.winnerProviderId).toBe('mymemory');
    expect(out.fallbackCount).toBe(1);
    expect(out.translations[0]).toMatchObject({ ok: true, providerId: 'mymemory', value: 'ok-de' });
  });

  it('throws when the entire chain reports retryable failures', async () => {
    const networkError = (): never => {
      const e = new Error('fetch failed');
      (e as unknown as { code?: string }).code = 'ECONNRESET';
      throw e;
    };
    resolveTranslatorMock
      .mockReturnValueOnce(fakeTranslator(networkError))
      .mockReturnValueOnce(fakeTranslator(networkError));
    const cfg: TranslateConfigInput = {
      primary: 'google',
      providers: [{ id: 'google' }, { id: 'mymemory' }],
      policy: { routing: 'auto' },
    };
    await expect(
      runTranslate(makeCtx(cfg), { texts: ['x'], targetLang: 'fr' }),
    ).rejects.toMatchObject({ issues: [{ code: ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR }] });
  });

  it('emits identity_streak warning issue when guard is enabled and threshold is hit', async () => {
    resolveTranslatorMock.mockReturnValue(fakeTranslator((t) => t));

    const sources = Array.from({ length: 8 }, (_, i) => `same-${String(i)}`);
    const out = await runTranslate(makeCtx(), {
      texts: sources,
      targetLang: 'fr',
      identityGuard: { enabled: true, threshold: 8 },
    });

    expect(out.issues.some((i) => i.code === ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING)).toBe(true);
    for (const t of out.translations) {
      if (t.ok) expect(t.value).toMatch(/^same-/);
    }
  });

  it('returns warnings forwarded from resolveTranslateConfig', async () => {
    resolveTranslatorMock.mockReturnValue(fakeTranslator((t) => `${t}-x`));

    // No translate.policy.routing → resolveTranslateConfig pushes a "defaulting to single" warning.
    const out = await runTranslate(makeCtx(), { texts: ['hi'], targetLang: 'fr' });
    expect(out.warnings.length).toBeGreaterThan(0);
  });
});
