import { describe, it, expect } from 'vitest';
import { groupKeysByTopSegment } from '@/core/ask/removal.js';

describe('groupKeysByTopSegment', () => {
  it('groups by first path segment', () => {
    const m = groupKeysByTopSegment(['pages.a', 'pages.b', 'common.x']);
    expect([...m.keys()].sort()).toEqual(['common', 'pages']);
    expect(m.get('pages')).toEqual(['pages.a', 'pages.b']);
    expect(m.get('common')).toEqual(['common.x']);
  });

  it('uses full key when no dot', () => {
    const m = groupKeysByTopSegment(['foo', 'bar.baz']);
    expect(m.get('foo')).toEqual(['foo']);
    expect(m.get('bar')).toEqual(['bar.baz']);
  });
});
