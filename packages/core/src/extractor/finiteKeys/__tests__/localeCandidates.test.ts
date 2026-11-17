import { describe, expect, it } from 'vitest';
import { FINITE_KEYS_LOCALE_CANDIDATE_CAP } from '../../../shared/constants/extractor.js';
import { collectLocaleInferredCandidates } from '../localeCandidates.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';

function leaf(path: string): TranslationSurfaceLeaf {
  return {
    path,
    value: path,
    shape: 'legacy_string',
    confidence: null,
    needsReview: null,
  };
}

describe('collectLocaleInferredCandidates', () => {
  it('lists leaves under the prefix as locale_inferred candidates (sorted)', () => {
    const out = collectLocaleInferredCandidates('app.nav', [
      leaf('app.nav.home'),
      leaf('app.other.x'),
      leaf('app.nav.about'),
      leaf('app.nav.home.title'),
    ]);
    expect(out.truncated).toBe(false);
    expect(out.candidates.map((c) => c.key)).toEqual([
      'app.nav.about',
      'app.nav.home',
      'app.nav.home.title',
    ]);
    expect(out.candidates.every((c) => c.confidence === 'locale_inferred')).toBe(true);
  });

  it('returns empty when no leaves match (prefix mismatch)', () => {
    const out = collectLocaleInferredCandidates('seo.routes', [leaf('seo.route.home.title')]);
    expect(out).toEqual({ candidates: [], truncated: false });
  });

  it('ignores empty / whitespace prefixes', () => {
    expect(collectLocaleInferredCandidates('', [leaf('a.b')])).toEqual({
      candidates: [],
      truncated: false,
    });
    expect(collectLocaleInferredCandidates('  ', [leaf('a.b')])).toEqual({
      candidates: [],
      truncated: false,
    });
  });

  it('caps the list and sets truncated', () => {
    const leaves = Array.from({ length: FINITE_KEYS_LOCALE_CANDIDATE_CAP + 3 }, (_, i) =>
      leaf(`app.nav.k${String(i).padStart(4, '0')}`),
    );
    const out = collectLocaleInferredCandidates('app.nav', leaves);
    expect(out.candidates).toHaveLength(FINITE_KEYS_LOCALE_CANDIDATE_CAP);
    expect(out.truncated).toBe(true);
  });

  it('includes an exact prefix leaf when the locale stores a string at the prefix', () => {
    const out = collectLocaleInferredCandidates('app.nav', [leaf('app.nav'), leaf('app.nav.x')]);
    expect(out.candidates.map((c) => c.key)).toEqual(['app.nav', 'app.nav.x']);
  });
});
