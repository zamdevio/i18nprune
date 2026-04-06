import { describe, it, expect } from 'vitest';
import { parseSyncLangSelection, isAllLangToken } from '@/utils/cli/args.js';

describe('parseSyncLangSelection', () => {
  it('defaults to all when no args', () => {
    expect(parseSyncLangSelection(undefined)).toEqual({ mode: 'all' });
  });

  it('parses all from --lang', () => {
    expect(parseSyncLangSelection('all')).toEqual({ mode: 'all' });
  });

  it('parses comma-separated codes', () => {
    expect(parseSyncLangSelection('ja, pt-br')).toEqual({
      mode: 'codes',
      codes: ['ja', 'pt-br'],
    });
  });
});

describe('isAllLangToken', () => {
  it('detects all', () => {
    expect(isAllLangToken('ALL')).toBe(true);
  });
});
