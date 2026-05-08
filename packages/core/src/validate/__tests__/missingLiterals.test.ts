import { describe, it, expect } from 'vitest';
import { compareDottedPathDepth, computeMissingLiteralKeysFromResolvedKeys } from '../missingLiterals.js';

describe('validate missingLiterals (pure)', () => {
  it('compareDottedPathDepth sorts shallow first', () => {
    expect(['a.b', 'a'].sort(compareDottedPathDepth)).toEqual(['a', 'a.b']);
  });

  it('computeMissingLiteralKeysFromResolvedKeys', () => {
    const locale = { a: { b: '1' }, keep: 'x' };
    const resolved = new Set<string>(['a.b', 'missing', 'keep']);
    expect(computeMissingLiteralKeysFromResolvedKeys(locale, resolved).sort()).toEqual(['missing']);
  });
});
