import { describe, expect, it } from 'vitest';
import { injectRootCommandAliases } from '../injectRootCommandAliases.js';

describe('injectRootCommandAliases', () => {
  it('prefixes short aliases on root Commands rows', () => {
    const raw = [
      'Commands:',
      '  validate               check keys',
      '  languages|langs        list languages',
      '  locales                locale group',
      '',
      'Global Options:',
    ].join('\n');
    const out = injectRootCommandAliases(raw);
    expect(out).toContain('v, validate');
    expect(out).toContain('langs, languages');
    expect(out).toContain('loc, locales');
    expect(out).not.toContain('Aliases:');
  });
});
