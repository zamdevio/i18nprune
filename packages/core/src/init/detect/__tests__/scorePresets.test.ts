import { describe, expect, it } from 'vitest';
import { isInitAutoAmbiguous, scoreInitPresets } from '../scorePresets.js';
import type { InitProjectSignals } from '../../../types/init/index.js';

const emptySignals: InitProjectSignals = {
  packageJson: { dependencies: {}, devDependencies: {} },
  topology: { localeRoots: [], nextConfigPresent: false },
};

describe('scoreInitPresets / isInitAutoAmbiguous', () => {
  it('low-signal project is not ambiguous (generic wins)', () => {
    const scores = scoreInitPresets(emptySignals);
    expect(isInitAutoAmbiguous(scores)).toBe(false);
  });

  it('is ambiguous when the top two presets are close and confident enough', () => {
    const scores = [
      {
        preset: 'next-intl' as const,
        rawScore: 0.5,
        score: 0.35,
        confidence: 0.35,
        factors: [],
      },
      {
        preset: 'i18next' as const,
        rawScore: 0.48,
        score: 0.33,
        confidence: 0.33,
        factors: [],
      },
      {
        preset: 'generic' as const,
        rawScore: 0.12,
        score: 0.12,
        confidence: 0.12,
        factors: [],
      },
    ];
    expect(isInitAutoAmbiguous(scores)).toBe(true);
  });
});
