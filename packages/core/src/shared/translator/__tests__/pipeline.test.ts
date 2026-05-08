import { describe, expect, it } from 'vitest';
import {
  bcp47PrimarySubtag,
  finalizeTranslationLeafMeta,
  localeJsonValueFromTranslation,
  mergeTranslationLeafMeta,
  unpackProviderTranslation,
  validateLeafTranslationString,
} from '../utils/pipeline.js';

describe('bcp47PrimarySubtag', () => {
  it('lowercases primary subtag', () => {
    expect(bcp47PrimarySubtag('en-US')).toBe('en');
    expect(bcp47PrimarySubtag('zh_Hans')).toBe('zh');
  });
});

describe('unpackProviderTranslation', () => {
  it('passes through plain string', () => {
    expect(unpackProviderTranslation('x')).toEqual({ text: 'x', patch: {} });
  });
  it('extracts text and leafMeta from yield', () => {
    expect(
      unpackProviderTranslation({
        text: 't',
        leafMeta: { confidence: 0.5, source: 'x' },
      }),
    ).toEqual({ text: 't', patch: { confidence: 0.5, source: 'x' } });
  });
});

describe('mergeTranslationLeafMeta', () => {
  it('provider overrides heuristic', () => {
    const h = {
      status: 'translated' as const,
      confidence: 0.1,
      needsReview: true,
      needsTranslationAgain: true,
      source: 'h',
    };
    const p = {
      status: 'translated' as const,
      confidence: 0.9,
      needsReview: false,
      needsTranslationAgain: false,
      source: 'p',
    };
    expect(mergeTranslationLeafMeta(h, p)).toEqual(p);
  });
});

describe('finalizeTranslationLeafMeta', () => {
  it('fills defaults for empty patch', () => {
    expect(finalizeTranslationLeafMeta({})).toEqual({
      status: 'translated',
      confidence: null,
      needsReview: false,
      needsTranslationAgain: false,
      source: 'manual',
    });
  });

  it('forces needsReview when decision is review', () => {
    expect(finalizeTranslationLeafMeta({ needsReview: false }, 'review').needsReview).toBe(true);
  });
});

describe('localeJsonValueFromTranslation', () => {
  it('returns plain text when not persisting', () => {
    expect(
      localeJsonValueFromTranslation(false, {
        text: 'hi',
        runtime: { attempts: 1, retries: 0 },
        leafMeta: {
          status: 'translated',
          confidence: null,
          needsReview: false,
          needsTranslationAgain: false,
          source: 'g',
        },
      }),
    ).toBe('hi');
  });
  it('returns structured node when persisting', () => {
    const v = localeJsonValueFromTranslation(true, {
      text: 'hi',
      runtime: { attempts: 2, retries: 1 },
      leafMeta: {
        status: 'translated',
        confidence: 0.8,
        needsReview: true,
        needsTranslationAgain: true,
        source: 'g',
      },
    });
    expect(v).toEqual({
      value: 'hi',
      status: 'translated',
      confidence: 0.8,
      needsReview: true,
      needsTranslationAgain: true,
      source: 'g',
    });
  });
});

describe('validateLeafTranslationString', () => {
  it('returns string input', () => {
    expect(validateLeafTranslationString('ok')).toBe('ok');
  });

  it('throws on non-string', () => {
    expect(() => validateLeafTranslationString(1)).toThrow(/non-string/);
  });
});
