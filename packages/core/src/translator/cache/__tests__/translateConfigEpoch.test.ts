import { describe, expect, it } from 'vitest';
import { computeTranslateConfigEpoch } from '../translateConfigEpoch.js';
import type { I18nPruneConfig } from '../../../config/index.js';

const baseTranslate: NonNullable<I18nPruneConfig['translate']> = {
  primary: 'deepl',
  workers: 1,
  providers: [{ id: 'deepl', apiKey: 'secret-a' }],
};

describe('computeTranslateConfigEpoch', () => {
  it('returns stable digest for the same translate config', () => {
    const a = computeTranslateConfigEpoch(baseTranslate);
    const b = computeTranslateConfigEpoch({ ...baseTranslate, workers: 1 });
    expect(a).toBe(b);
    expect(a).not.toBe('none');
  });

  it('ignores provider apiKey when computing epoch', () => {
    const a = computeTranslateConfigEpoch(baseTranslate);
    const b = computeTranslateConfigEpoch({
      ...baseTranslate,
      providers: [{ id: 'deepl', apiKey: 'secret-b' }],
    });
    expect(a).toBe(b);
  });

  it('changes when translate policy inputs change', () => {
    const a = computeTranslateConfigEpoch(baseTranslate);
    const b = computeTranslateConfigEpoch({
      ...baseTranslate,
      primary: 'google',
      providers: [{ id: 'google' }],
    });
    expect(a).not.toBe(b);
  });

  it('returns none when translate config is undefined', () => {
    expect(computeTranslateConfigEpoch(undefined)).toBe('none');
  });
});
