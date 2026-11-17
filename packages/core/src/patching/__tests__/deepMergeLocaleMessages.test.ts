import { describe, expect, it } from 'vitest';
import {
  DEEP_MERGE_LOCALE_MESSAGES_HELPER_SOURCE,
  deepMergeLocaleMessages,
} from '../deepMergeLocaleMessages.js';

describe('deepMergeLocaleMessages (BUG-004)', () => {
  it('merges overlapping object layers without dropping sibling keys', () => {
    const a = { pages: { dashboard: { title: 'Dash' } } };
    const b = { pages: { login: { title: 'Login' } } };
    expect(deepMergeLocaleMessages(a, b)).toEqual({
      pages: {
        dashboard: { title: 'Dash' },
        login: { title: 'Login' },
      },
    });
  });

  it('lets later primitives and arrays win at the same path', () => {
    expect(deepMergeLocaleMessages({ a: 'x', list: [1] }, { a: 'y', list: [2, 3] })).toEqual({
      a: 'y',
      list: [2, 3],
    });
  });

  it('keeps keys that only exist on the left', () => {
    expect(deepMergeLocaleMessages({ keep: true, nest: { a: 1 } }, { nest: { b: 2 } })).toEqual({
      keep: true,
      nest: { a: 1, b: 2 },
    });
  });

  it('helper source stays present for generated loaders', () => {
    expect(DEEP_MERGE_LOCALE_MESSAGES_HELPER_SOURCE).toContain('function deepMergeLocaleMessages');
    expect(DEEP_MERGE_LOCALE_MESSAGES_HELPER_SOURCE).toContain('Object.keys(source)');
  });
});
