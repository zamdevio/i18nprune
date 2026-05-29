import { describe, expect, it } from 'vitest';
import { applyCleanupKeysToLocaleJson } from '../apply.js';

describe('cleanup apply', () => {
  it('removes dotted top-level keys in flat locale JSON', () => {
    const input = {
      'app.title': 'Title',
      'path.to.key': 'orphan',
    };
    const out = applyCleanupKeysToLocaleJson(input, ['path.to.key']);
    expect(out.removedPaths).toEqual(['path.to.key']);
    expect(out.next).toEqual({ 'app.title': 'Title' });
  });

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
