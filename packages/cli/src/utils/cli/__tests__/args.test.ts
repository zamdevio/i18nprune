import { describe, it, expect } from 'vitest';
import { parseSyncLangSelection, isAllLangToken, pickTargetSelector } from '@/utils/cli/args.js';

describe('parseSyncLangSelection', () => {
  it('defaults to all when no args', () => {
    expect(parseSyncLangSelection(undefined)).toEqual({ mode: 'all' });
  });

  it('parses all token', () => {
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

describe('pickTargetSelector', () => {
  it('uses target when set', () => {
    expect(pickTargetSelector('ar,id')).toBe('ar,id');
  });
});
