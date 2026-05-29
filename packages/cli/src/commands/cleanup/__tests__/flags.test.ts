import { describe, expect, it } from 'vitest';
import { resolveCleanupNoRg } from '../flags.js';

describe('resolveCleanupNoRg', () => {
  it('treats Commander --no-rg as rg: false', () => {
    expect(resolveCleanupNoRg({ rg: false })).toBe(true);
    expect(resolveCleanupNoRg({ rg: true })).toBe(false);
  });

  it('accepts explicit noRg', () => {
    expect(resolveCleanupNoRg({ noRg: true })).toBe(true);
  });
});
