import { describe, expect, it } from 'vitest';
import { mergePartialConfigIntoBase } from '../resolve/index.js';

describe('mergePartialConfigIntoBase', () => {
  it('deep-merges nested `locales` object', () => {
    const base = {
      locales: { source: 'locales/en.json', directory: 'locales' },
      src: 'src',
      functions: ['t'],
    };
    const out = mergePartialConfigIntoBase(base, { locales: { directory: 'localesA' } });
    expect((out.locales as { source: string; directory: string }).directory).toBe('localesA');
    expect((out.locales as { source: string; directory: string }).source).toBe('locales/en.json');
  });

  it('deep-merges nested plain objects', () => {
    const base = {
      locales: { source: 'a', directory: 'l' },
      src: 's',
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
