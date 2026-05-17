import { describe, expect, it } from 'vitest';
import { findTranslationCallSites } from '../calls.js';

describe('findTranslationCallSites (prose first-arg filter)', () => {
  it('skips calls whose first argument is ASCII lowercase prose', () => {
    expect(findTranslationCallSites(`t (or vice versa)\n`, ['t'])).toHaveLength(0);
    expect(findTranslationCallSites(`t(or vice versa)\n`, ['t'])).toHaveLength(0);
  });

  it('still records normal literal and template calls', () => {
    const text = `t('a.b'); t(\`x.\${y}\`);`;
    const sites = findTranslationCallSites(text, ['t']);
    expect(sites).toHaveLength(2);
    expect(sites[0]!.firstArgRaw).toBe(`'a.b'`);
    expect(sites[1]!.firstArgRaw.startsWith('`')).toBe(true);
  });

  it('still records single-token first arguments', () => {
    expect(findTranslationCallSites(`t(key)\n`, ['t'])).toHaveLength(1);
    expect(findTranslationCallSites(`t(ns.key)\n`, ['t'])).toHaveLength(1);
    expect(findTranslationCallSites(`t(__)\n`, ['t'])).toHaveLength(1);
  });

  it('still records calls with non-lowercase or punctuation inside the first arg span', () => {
    expect(findTranslationCallSites(`t(new Date())\n`, ['t'])).toHaveLength(1);
    expect(findTranslationCallSites(`t(Foo.bar)\n`, ['t'])).toHaveLength(1);
  });
});
