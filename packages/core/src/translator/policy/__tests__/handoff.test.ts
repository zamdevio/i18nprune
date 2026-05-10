import { describe, expect, it } from 'vitest';
import {
  buildHandoffCatalogEligible,
  HANDOFF_PROVIDER_ORDER,
  prioritizeProviderAfter,
  shouldOfferHandoffInteractivePrompt,
  shouldWarnAndAbortHandoffOnNonTty,
  synthesizeHandoffTranslationOptions,
} from '../handoff.js';

describe('HANDOFF_PROVIDER_ORDER', () => {
  it('pins google first then matches registry extension order', () => {
    expect(HANDOFF_PROVIDER_ORDER[0]).toBe('google');
    expect(HANDOFF_PROVIDER_ORDER.length).toBe(5);
  });
});

describe('shouldOfferHandoffInteractivePrompt', () => {
  it('matrix: auto routing never offers (auto handoff)', () => {
    expect(
      shouldOfferHandoffInteractivePrompt({ routing: 'auto', handoff: 'auto', isTty: true }),
    ).toBe(false);
  });
  it('matrix: single + auto handoff + TTY offers', () => {
    expect(
      shouldOfferHandoffInteractivePrompt({ routing: 'single', handoff: 'auto', isTty: true }),
    ).toBe(true);
  });
  it('handoff on + non-TTY does not offer', () => {
    expect(
      shouldOfferHandoffInteractivePrompt({ routing: 'single', handoff: 'on', isTty: false }),
    ).toBe(false);
  });
});

describe('shouldWarnAndAbortHandoffOnNonTty', () => {
  it('single · on · non-TTY → warn+abort path', () => {
    expect(
      shouldWarnAndAbortHandoffOnNonTty({
        routing: 'single',
        handoff: 'on',
        isTty: false,
      }),
    ).toBe(true);
  });
});

describe('buildHandoffCatalogEligible', () => {
  it('excludes failing provider and hides ineligible deepl without key', () => {
    const r = buildHandoffCatalogEligible(
      'google',
      {},
      undefined,
    );
    const ids = r.eligibleRows.map((x) => x.id);
    expect(ids).not.toContain('google');
    expect(ids.join(',')).toContain('mymemory');
    expect(ids).not.toContain('deepl');
    expect(r.ineligibleReasons.deepl).toContain('apiKey');
  });

  it('shows google as recommended when first eligible', () => {
    const r = buildHandoffCatalogEligible('mymemory', {}, undefined);
    expect(r.eligibleRows[0]).toEqual({ id: 'google', recommended: true });
  });
});

describe('prioritizeProviderAfter', () => {
  it('moves a later duplicate to sit after failing id', () => {
    const c: Array<'google' | 'mymemory' | 'deepl'> = ['google', 'mymemory', 'deepl'];
    prioritizeProviderAfter(c, 0, 'deepl');
    expect(c).toEqual(['google', 'deepl', 'mymemory']);
  });

  it('inserts catalog pick not present in chain', () => {
    const c: Array<'google' | 'mymemory'> = ['google'];
    prioritizeProviderAfter(c, 0, 'mymemory');
    expect(c).toEqual(['google', 'mymemory']);
  });

  it('no-op when pick already immediately follows failing', () => {
    const c: Array<'google' | 'mymemory'> = ['google', 'mymemory'];
    prioritizeProviderAfter(c, 0, 'mymemory');
    expect(c).toEqual(['google', 'mymemory']);
  });
});

describe('synthesizeHandoffTranslationOptions', () => {
  it('deepl appears when I18NPRUNE_TRANSLATE_DEEPL_API_KEY is set', () => {
    const r = buildHandoffCatalogEligible(
      'google',
      { I18NPRUNE_TRANSLATE_DEEPL_API_KEY: 'test-key' },
      undefined,
    );
    expect(r.eligibleRows.some((x) => x.id === 'deepl')).toBe(true);
  });

  it('fills public libre origin when missing', () => {
    const o = synthesizeHandoffTranslationOptions({
      id: 'libre',
      env: {},
      config: undefined,
    });
    expect(o.provider).toBe('libre');
    if (o.provider === 'libre') {
      expect(o.baseUrl).toMatch(/libretranslate/);
    }
  });
});
