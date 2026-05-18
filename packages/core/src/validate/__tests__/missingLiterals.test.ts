import { describe, it, expect } from 'vitest';
import {
  compareDottedPathDepth,
  computeMissingLiteralKeysFromLeaves,
  computeMissingLiteralKeysFromResolvedKeys,
  encodeLocaleLeafIdentity,
} from '../missingLiterals.js';

describe('validate missingLiterals (pure)', () => {
  it('compareDottedPathDepth sorts shallow first', () => {
    expect(['a.b', 'a'].sort(compareDottedPathDepth)).toEqual(['a', 'a.b']);
  });

  it('computeMissingLiteralKeysFromResolvedKeys', () => {
    const locale = { a: { b: '1' }, keep: 'x' };
    const resolved = new Set<string>(['a.b', 'missing', 'keep']);
    expect(computeMissingLiteralKeysFromResolvedKeys(locale, resolved).sort()).toEqual(['missing']);
  });

  it('computeMissingLiteralKeysFromLeaves unions logical paths across segments', () => {
    const leaves = [
      { path: 'app.title' },
      { path: 'app.title' },
      { path: 'other.key' },
    ];
    const resolved = new Set<string>(['app.title', 'app.missing', 'other.key']);
    expect(computeMissingLiteralKeysFromLeaves(leaves, resolved)).toEqual(['app.missing']);
  });

  it('encodeLocaleLeafIdentity is stable', () => {
    expect(encodeLocaleLeafIdentity('en/a.json', 'app.title')).toContain('app.title');
    expect(encodeLocaleLeafIdentity('en/a.json', 'app.title')).not.toBe(
      encodeLocaleLeafIdentity('en/b.json', 'app.title'),
    );
  });
});
