import { describe, expect, it } from 'vitest';
import { localeJsonContentEquals, sortJsonObjectKeysAsc } from '../sortKeys.js';

describe('sortJsonObjectKeysAsc', () => {
  it('sorts nested object keys A→Z at every level', () => {
    const input = {
      app: {
        title: 'T',
        description: 'D',
      },
      z: 1,
      a: 2,
    };
    expect(sortJsonObjectKeysAsc(input)).toEqual({
      a: 2,
      app: {
        description: 'D',
        title: 'T',
      },
      z: 1,
    });
  });

  it('treats key-order-only differences as equal', () => {
    const a = { app: { title: 'T', description: 'D' } };
    const b = { app: { description: 'D', title: 'T' } };
    expect(localeJsonContentEquals(a, b)).toBe(true);
  });
});
