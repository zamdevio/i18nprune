import { describe, it, expect } from 'vitest';
import { computeEnglishIdenticalCounts } from '../englishIdentical.js';

describe('computeEnglishIdenticalCounts', () => {
  it('counts leaves equal to source and skips missing paths', () => {
    const { total, perFile } = computeEnglishIdenticalCounts({
      sourceLeaves: [
        { path: 'a', value: 'Hello' },
        { path: 'b', value: 'World' },
      ],
      targets: [
        {
          fileBasename: 'de.json',
          leaves: [
            { path: 'a', value: 'Hello' },
            { path: 'b', value: 'Other' },
            { path: 'c', value: 'Extra' },
          ],
        },
      ],
    });
    expect(total).toBe(1);
    expect(perFile['de.json']).toBe(1);
  });

  it('applies parity exclusions', () => {
    const { total } = computeEnglishIdenticalCounts({
      sourceLeaves: [{ path: 'x', value: 'Same' }],
      targets: [
        {
          fileBasename: 'fr.json',
          leaves: [{ path: 'x', value: 'Same' }],
        },
      ],
      parity: { excludeKeys: ['x'] },
    });
    expect(total).toBe(0);
  });
});
