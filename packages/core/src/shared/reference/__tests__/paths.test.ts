import { describe, expect, it } from 'vitest';
import { pathUnderAnyUncertainPrefix, pathUnderUncertainPrefix } from '../paths.js';

describe('path uncertainty helpers', () => {
  it('matches exact and nested paths', () => {
    expect(pathUnderUncertainPrefix('a.b', 'a.b')).toBe(true);
    expect(pathUnderUncertainPrefix('a.b.c', 'a.b')).toBe(true);
    expect(pathUnderUncertainPrefix('a.b[0]', 'a.b')).toBe(true);
    expect(pathUnderUncertainPrefix('a.x', 'a.b')).toBe(false);
  });

  it('matches any uncertain prefix', () => {
    expect(pathUnderAnyUncertainPrefix('x.y.z', ['a.b', 'x.y'])).toBe(true);
    expect(pathUnderAnyUncertainPrefix('x.z', ['a.b', 'x.y'])).toBe(false);
  });
});
