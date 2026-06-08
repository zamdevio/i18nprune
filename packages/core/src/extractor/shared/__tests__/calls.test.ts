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

  it('does not treat nested-call first args as prose (E.4b)', () => {
    const text = 't(fn(`x.${y}`));';
    const sites = findTranslationCallSites(text, ['t']);
    expect(sites).toHaveLength(1);
    expect(sites[0]!.firstArgRaw).toBe('fn(`x.${y}`)');
  });

  it('skips markdown-style prose samples with lowercase word runs (E.4a)', () => {
    expect(findTranslationCallSites('t (see also docs)\n', ['t'])).toHaveLength(0);
    expect(findTranslationCallSites('t(for example only)\n', ['t'])).toHaveLength(0);
  });

  it('does not match optional chaining call forms without further support (E.4c)', () => {
    expect(findTranslationCallSites(`i18n.t?.('key')\n`, ['t'])).toHaveLength(0);
  });
});
