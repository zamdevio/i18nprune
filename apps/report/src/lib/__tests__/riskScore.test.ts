import { describe, it, expect } from 'vitest';
import { computeRiskScore } from '../risk/index.js';

describe('computeRiskScore', () => {
  it('uses missing×5 + dynamic×2', () => {
    expect(computeRiskScore({ missingKeysCount: 2, dynamicSitesCount: 3 })).toEqual({
      score: 16,
      level: 'high',
    });
  });

  it('labels low when zero', () => {
    expect(computeRiskScore({ missingKeysCount: 0, dynamicSitesCount: 0 })).toEqual({
      score: 0,
      level: 'low',
    });
  });
});
