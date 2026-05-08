import { describe, expect, it } from 'vitest';
import { applyCleanupKeysToLocaleJson } from '../apply.js';

describe('cleanup apply', () => {
  it('removes only present paths and reports removed keys', () => {
    const input = {
      home: { title: 'Home', subtitle: 'Welcome' },
      nested: { keep: 'x' },
    };
    const out = applyCleanupKeysToLocaleJson(input, ['home.subtitle', 'missing.path']);
    expect(out.removedPaths).toEqual(['home.subtitle']);
    expect(out.next).toEqual({
      home: { title: 'Home' },
      nested: { keep: 'x' },
    });
  });
});
