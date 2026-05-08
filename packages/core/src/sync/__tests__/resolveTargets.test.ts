import { describe, expect, it } from 'vitest';
import { resolveSyncTargetFiles } from '../resolveTargets.js';

describe('resolveSyncTargetFiles', () => {
  const localeJsonBasenames = ['en.json', 'fr.json', 'ja.json'];

  it('returns all non-source files for mode all', () => {
    expect(
      resolveSyncTargetFiles({
        localeJsonBasenames,
        sourceJsonBasename: 'en.json',
        selection: { mode: 'all' },
      }),
    ).toEqual({
      targetFiles: ['fr.json', 'ja.json'],
      missingLocaleCodes: [],
    });
  });

  it('resolves explicit codes and missing', () => {
    expect(
      resolveSyncTargetFiles({
        localeJsonBasenames,
        sourceJsonBasename: 'en.json',
        selection: { mode: 'codes', codes: ['fr', 'de'] },
      }),
    ).toEqual({
      targetFiles: ['fr.json'],
      missingLocaleCodes: ['de'],
    });
  });

  it('empty targets when codes list none present', () => {
    expect(
      resolveSyncTargetFiles({
        localeJsonBasenames,
        sourceJsonBasename: 'en.json',
        selection: { mode: 'codes', codes: ['zz'] },
      }),
    ).toEqual({
      targetFiles: [],
      missingLocaleCodes: ['zz'],
    });
  });
});
