import { describe, expect, it } from 'vitest';
import { applyLocaleLeafMode, resolveLocaleLeafMode } from '../index.js';

describe('applyLocaleLeafMode', () => {
  it('skips writes for already-valid structured terminals', () => {
    const sourceMap = new Map<string, string>([['a', 'src a']]);
    const locale = {
      a: {
        value: 'translated',
        status: 'translated',
        confidence: null as number | null,
        needsReview: false,
        source: 'manual',
        needsTranslationAgain: false,
      },
    };
    const out = applyLocaleLeafMode({ localeJson: locale, sourceMap, mode: 'structured' });
    expect(out.next).toEqual(locale);
    expect(out.report.structuredLeavesWritten).toBe(0);
    expect(out.report.unchangedLeaves).toBe(1);
    expect(out.report.promotedLegacyLeaves).toBe(0);
  });

  it('materializes missing canonical metadata keys without marking needsReview when only thinning', () => {
    const sourceMap = new Map<string, string>([['a', 'src']]);
    const locale = { a: { value: 'hello', status: 'translated', source: 'google-heuristic' } };
    const out = applyLocaleLeafMode({ localeJson: locale, sourceMap, mode: 'structured' });
    expect(out.report.structuredLeavesWritten).toBe(1);
    expect(out.report.byReason.canonical_metadata_materialized).toBe(1);
    const leaf = (out.next as { a: Record<string, unknown> }).a;
    expect(leaf.confidence).toBe(null);
    expect(leaf.needsReview).toBe(false);
    expect(leaf.needsTranslationAgain).toBe(false);

    const out2 = applyLocaleLeafMode({ localeJson: out.next, sourceMap, mode: 'structured' });
    expect(out2.report.structuredLeavesWritten).toBe(0);
  });

  it('emits per-leaf decisions for structured mode', () => {
    const sourceMap = new Map<string, string>([
      ['a', 'en a'],
      ['b', 'en b'],
      ['c', 'en c'],
    ]);
    const locale = {
      a: 'bonjour',
      b: { value: 'hola', status: '', confidence: 'bad', needsReview: 'x' },
    };
    const out = applyLocaleLeafMode({ localeJson: locale, sourceMap, mode: 'structured' });
    expect(out.report.leafDecisions).toHaveLength(3);
    const next = out.next as Record<string, unknown>;
    const promoted = next.a as { needsReview?: boolean };
    expect(promoted.needsReview).toBe(true);
    const byPath = new Map(out.report.leafDecisions.map((d) => [d.path, d]));
    expect(byPath.get('a')?.action).toBe('promoted_legacy');
    expect(byPath.get('b')?.action).toBe('repaired_corrupt');
    expect(byPath.get('c')?.action).toBe('repaired_corrupt');
    expect(out.report.repairedCorruptLeaves).toBeGreaterThan(0);
    expect(out.report.structuredLeavesWritten).toBe(3);
  });

  it('emits per-leaf decisions for legacy mode strip/hydrate', () => {
    const sourceMap = new Map<string, string>([
      ['a', 'en a'],
      ['b', 'en b'],
    ]);
    const locale = {
      a: { value: 'ja a', status: 'translated' },
    };
    const out = applyLocaleLeafMode({ localeJson: locale, sourceMap, mode: 'legacy_string' });
    const byPath = new Map(out.report.leafDecisions.map((d) => [d.path, d]));
    expect(byPath.get('a')?.action).toBe('stripped_structured');
    expect(byPath.get('b')?.action).toBe('hydrated_missing');
    expect(out.report.strippedStructuredLeaves).toBe(1);
    expect(out.report.missingPathsHydratedFromSource).toBe(1);
    expect(out.report.structuredLeavesWritten).toBe(0);
  });

  it('resolves mode precedence with strip over metadata', () => {
    const out = resolveLocaleLeafMode({
      configMode: 'structured',
      metadataFlag: true,
      stripMetadataFlag: true,
    });
    expect(out.mode).toBe('legacy_string');
    expect(out.conflict).toBe(true);
    expect(out.reason).toBe('strip_precedence');
  });
});

