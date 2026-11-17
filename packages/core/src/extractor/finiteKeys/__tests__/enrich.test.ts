import { describe, expect, it } from 'vitest';
import { enrichDynamicSitesWithLocaleCandidates } from '../enrich.js';
import type { DynamicKeySite } from '../../../types/extractor/dynamic/index.js';
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

function site(partial: Partial<DynamicKeySite> & Pick<DynamicKeySite, 'kind'>): DynamicKeySite {
  return {
    functionName: 't',
    preview: 't(…)',
    ...partial,
  };
}

describe('enrichDynamicSitesWithLocaleCandidates', () => {
  it('attaches locale candidates for template sites with staticPrefix', () => {
    const sites = [
      site({
        kind: 'template_interpolation',
        staticPrefix: 'app.nav',
        resolvedPrefix: 'app.nav',
        runtimeSegments: ['id'],
      }),
      site({ kind: 'non_literal', preview: 't(x)' }),
    ];
    const out = enrichDynamicSitesWithLocaleCandidates(sites, [
      leaf('app.nav.home'),
      leaf('app.nav.about'),
    ]);
    expect(out[0]?.candidateKeys?.map((c) => c.key)).toEqual(['app.nav.about', 'app.nav.home']);
    expect(out[0]?.candidateKeysTruncated).toBeUndefined();
    expect(out[1]?.candidateKeys).toBeUndefined();
  });

  it('falls back to resolvedPrefix when staticPrefix is missing', () => {
    const sites = [site({ kind: 'template_interpolation', resolvedPrefix: 'seo.routes' })];
    const out = enrichDynamicSitesWithLocaleCandidates(sites, [leaf('seo.routes.home.title')]);
    expect(out[0]?.candidateKeys?.map((c) => c.key)).toEqual(['seo.routes.home.title']);
  });

  it('strips prior candidate fields before re-enriching (idempotent)', () => {
    const sites = [
      site({
        kind: 'template_interpolation',
        staticPrefix: 'app.nav',
        candidateKeys: [{ key: 'stale', confidence: 'locale_inferred' }],
        candidateKeysTruncated: true,
      }),
    ];
    const out = enrichDynamicSitesWithLocaleCandidates(sites, [leaf('app.nav.home')]);
    expect(out[0]?.candidateKeys?.map((c) => c.key)).toEqual(['app.nav.home']);
    expect(out[0]?.candidateKeysTruncated).toBeUndefined();
  });

  it('does not mutate the input sites array or objects', () => {
    const original = site({
      kind: 'template_interpolation',
      staticPrefix: 'app.nav',
    });
    const sites = [original];
    const out = enrichDynamicSitesWithLocaleCandidates(sites, [leaf('app.nav.home')]);
    expect(out).not.toBe(sites);
    expect(out[0]).not.toBe(original);
    expect(original.candidateKeys).toBeUndefined();
  });
});
