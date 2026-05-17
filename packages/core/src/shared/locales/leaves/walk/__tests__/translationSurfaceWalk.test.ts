import { describe, expect, it } from 'vitest';
import {
  collectTranslationSurfaceLeaves,
  isCompleteStructuredLocaleLeafMeta,
  isStructuredLocaleLeafNode,
} from '../translationSurfaceWalk.js';

describe('collectTranslationSurfaceLeaves', () => {
  it('collects legacy string leaves', () => {
    const rows = collectTranslationSurfaceLeaves({ a: { b: 'hello' } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ path: 'a.b', value: 'hello', shape: 'legacy_string' });
  });

  it('collects nested legacy paths', () => {
    const leaves = collectTranslationSurfaceLeaves({ a: { b: 'x' }, c: [{ d: 'y' }] });
    const paths = leaves.map((l) => l.path).sort();
    expect(paths).toEqual(['a.b', 'c[0].d']);
  });

  it('treats { value } objects as structured terminals', () => {
    const rows = collectTranslationSurfaceLeaves({
      k: {
        value: 'x',
        status: 'translated',
        confidence: 0.9,
        needsReview: false,
        source: 'manual',
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      path: 'k',
      value: 'x',
      shape: 'structured',
      status: 'translated',
      confidence: 0.9,
      needsReview: false,
      source: 'manual',
      structuredMetaComplete: false,
    });
  });

  it('marks structuredMetaComplete when all canonical fields are valid', () => {
    const raw = {
      value: 'x',
      status: 'translated',
      confidence: 0.5,
      needsReview: false,
      needsTranslationAgain: false,
      source: 'manual',
    };
    const rows = collectTranslationSurfaceLeaves({ k: raw });
    expect(rows[0]?.structuredMetaComplete).toBe(true);
    expect(isCompleteStructuredLocaleLeafMeta(raw)).toBe(true);
  });

  it('isCompleteStructuredLocaleLeafMeta rejects partial metadata', () => {
    expect(
      isCompleteStructuredLocaleLeafMeta({
        value: 'x',
        status: 'translated',
        confidence: 0.5,
        needsReview: false,
        source: 'manual',
      }),
    ).toBe(false);
  });

  it('stamps every leaf when segment source is passed', () => {
    const origin = {
      file: '/tmp/locales/en.json',
      locale: 'en',
      relativePath: 'en.json',
    };
    const rows = collectTranslationSurfaceLeaves({ a: { b: 'hello' } }, '', [], origin);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.fileOrigin).toEqual(origin);
  });

  it('stamps structured leaves with fileOrigin and source', () => {
    const origin = {
      file: '/tmp/locales/en.json',
      locale: 'en',
      relativePath: 'en.json',
    };
    const rows = collectTranslationSurfaceLeaves(
      {
        k: {
          value: 'x',
          status: 'translated',
          confidence: 0.9,
          needsReview: false,
          source: 'manual',
        },
      },
      '',
      [],
      origin,
    );
    expect(rows[0]?.fileOrigin).toEqual(origin);
    expect(rows[0]?.source).toBe('manual');
  });

  it('identifies structured leaf shape helper', () => {
    expect(isStructuredLocaleLeafNode({ value: 'z' })).toBe(true);
    expect(isStructuredLocaleLeafNode('z')).toBe(false);
  });
});
