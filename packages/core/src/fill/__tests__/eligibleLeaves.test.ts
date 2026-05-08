import { describe, expect, it } from 'vitest';
import { isFillCandidateLeaf } from '../eligibleLeaves.js';
import { leafMatchesSourceForFill } from '../leafMatchesSourceForFill.js';

const eff = {
  treatCommentedCallSitesAsRuntime: false,
  treatNonSourceFileSitesAsRuntime: false,
  uncertainKeyPolicy: 'protect' as const,
  stringPresence: 'guard' as const,
  stringPresenceMaxHitsPerKey: 5,
  respectPreserve: true,
};

const legacy = (path: string, value: string) =>
  ({ path, value, shape: 'legacy_string' as const, confidence: null, needsReview: null }) as const;

describe('leafMatchesSourceForFill', () => {
  it('treats trimmed / case-folded strings as matching source', () => {
    expect(leafMatchesSourceForFill('  Hello  ', 'Hello')).toBe(true);
    expect(leafMatchesSourceForFill('hello', 'HELLO')).toBe(true);
  });
});

describe('isFillCandidateLeaf', () => {
  it('returns true when value still equals source and passes guards', () => {
    const ok = isFillCandidateLeaf({
      leaf: legacy('a', 'Hello'),
      sourceMap: new Map([['a', 'Hello']]),
      refCtx: { uncertainPrefixes: [] },
      eff,
    });
    expect(ok).toBe(true);
  });

  it('returns false when translation already differs from source', () => {
    const ok = isFillCandidateLeaf({
      leaf: legacy('a', 'Hola'),
      sourceMap: new Map([['a', 'Hello']]),
      refCtx: { uncertainPrefixes: [] },
      eff,
    });
    expect(ok).toBe(false);
  });

  it('returns false under uncertain prefix when policy protects', () => {
    const ok = isFillCandidateLeaf({
      leaf: legacy('a.b', 'x'),
      sourceMap: new Map([['a.b', 'x']]),
      refCtx: { uncertainPrefixes: ['a'] },
      eff,
    });
    expect(ok).toBe(false);
  });

  it('structured + complete meta: needsTranslationAgain selects even when value differs from source', () => {
    const ok = isFillCandidateLeaf({
      leaf: {
        path: 'k',
        value: 'Already translated',
        shape: 'structured',
        status: 'translated',
        confidence: 0.9,
        needsReview: false,
        needsTranslationAgain: true,
        source: 'manual',
        structuredMetaComplete: true,
      },
      sourceMap: new Map([['k', 'Hello']]),
      refCtx: { uncertainPrefixes: [] },
      eff,
    });
    expect(ok).toBe(true);
  });

  it('structured + complete meta: false when not stale and not requeue', () => {
    const ok = isFillCandidateLeaf({
      leaf: {
        path: 'k',
        value: 'Bonjour',
        shape: 'structured',
        status: 'translated',
        confidence: 0.4,
        needsReview: false,
        needsTranslationAgain: false,
        source: 'manual',
        structuredMetaComplete: true,
      },
      sourceMap: new Map([['k', 'Hello']]),
      refCtx: { uncertainPrefixes: [] },
      eff,
    });
    expect(ok).toBe(false);
  });

  it('structured + complete meta: true for fuzzy stale copy vs source', () => {
    const ok = isFillCandidateLeaf({
      leaf: {
        path: 'k',
        value: '  Hello  ',
        shape: 'structured',
        status: 'translated',
        confidence: 0.99,
        needsReview: false,
        needsTranslationAgain: false,
        source: 'manual',
        structuredMetaComplete: true,
      },
      sourceMap: new Map([['k', 'Hello']]),
      refCtx: { uncertainPrefixes: [] },
      eff,
    });
    expect(ok).toBe(true);
  });

  it('structured + incomplete meta falls back to stale-only rule', () => {
    const ok = isFillCandidateLeaf({
      leaf: {
        path: 'k',
        value: 'Hello',
        shape: 'structured',
        status: 'translated',
        confidence: 0.4,
        needsReview: false,
        structuredMetaComplete: false,
      },
      sourceMap: new Map([['k', 'Hello']]),
      refCtx: { uncertainPrefixes: [] },
      eff,
    });
    expect(ok).toBe(true);
  });
});
