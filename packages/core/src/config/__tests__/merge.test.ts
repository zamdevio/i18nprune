import { describe, expect, it } from 'vitest';
import { mergePartialConfigIntoBase } from '../resolve/index.js';

describe('mergePartialConfigIntoBase', () => {
  it('overrides top-level scalars', () => {
    const base = { source: 'locales/en.json', src: 'src', localesDir: 'locales', functions: ['t'] };
    expect(mergePartialConfigIntoBase(base, { localesDir: 'localesA' }).localesDir).toBe('localesA');
    expect(mergePartialConfigIntoBase(base, { localesDir: 'localesA' }).source).toBe('locales/en.json');
  });

  it('deep-merges nested plain objects', () => {
    const base = {
      source: 'a',
      src: 's',
      localesDir: 'l',
      functions: ['t'],
      exclude: { dirs: ['a'], useDefaultSkip: true },
    };
    const out = mergePartialConfigIntoBase(base, { exclude: { dirs: ['b'] } });
    expect((out.exclude as { dirs: string[] }).dirs).toEqual(['b']);
    expect((out.exclude as { useDefaultSkip?: boolean }).useDefaultSkip).toBe(true);
  });

  it('replaces arrays', () => {
    const base = { functions: ['t'], a: 1 };
    expect(mergePartialConfigIntoBase(base, { functions: ['t', 'tt'] }).functions).toEqual(['t', 'tt']);
  });
});
