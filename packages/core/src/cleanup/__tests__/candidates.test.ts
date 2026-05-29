import { describe, it, expect } from 'vitest';
import { computeCleanupCandidateKeys, pathUnderRoot } from '../candidates.js';

describe('cleanup candidates', () => {
  it('pathUnderRoot', () => {
    const roots = new Set(['a', 'items']);
    expect(pathUnderRoot('a', roots)).toBe(true);
    expect(pathUnderRoot('a.b', roots)).toBe(true);
    expect(pathUnderRoot('items[0].x', roots)).toBe(true);
    expect(pathUnderRoot('other', roots)).toBe(false);
  });

  it('computeCleanupCandidateKeys excludes resolved and preserve', () => {
    const usage = {
      resolvedKeys: new Set<string>(['keep.used']),
      uncertainPrefixes: new Set<string>(),
      usedRoots: new Set<string>(),
    };
    const leaves = [{ path: 'keep.used', value: '1' }, { path: 'orphan', value: '2' }, { path: 'locked', value: '3' }];
    const r = computeCleanupCandidateKeys({
      leaves,
      usage,
      preserve: { copyKeys: ['locked'] },
      uncertainPrefixes: [],
      filterUncertainPrefixes: false,
    });
    expect([...r.candidates].sort()).toEqual(['orphan']);
  });

  it('does not treat keys under a used root namespace as used unless scanned literally', () => {
    const usage = {
      resolvedKeys: new Set<string>(['app.title', 'app.description']),
      uncertainPrefixes: new Set<string>(),
      usedRoots: new Set<string>(['app']),
    };
    const leaves = [
      { path: 'app.title', value: '1' },
      { path: 'app.description', value: '2' },
      { path: 'app.header', value: '3' },
      { path: 'apap.header', value: '4' },
    ];
    const r = computeCleanupCandidateKeys({
      leaves,
      usage,
      uncertainPrefixes: [],
      filterUncertainPrefixes: false,
    });
    expect([...r.candidates].sort()).toEqual(['apap.header', 'app.header']);
  });

  it('filterUncertainPrefixes removes candidates under uncertain static prefixes', () => {
    const usage = {
      resolvedKeys: new Set<string>(),
      uncertainPrefixes: new Set<string>(),
      usedRoots: new Set<string>(),
    };
    const r = computeCleanupCandidateKeys({
      leaves: [{ path: 'x.y', value: 'a' }],
      usage,
      uncertainPrefixes: ['x'],
      filterUncertainPrefixes: true,
    });
    expect(r.candidates).toHaveLength(0);
    expect(r.excludedUncertain).toBe(1);
  });
});
