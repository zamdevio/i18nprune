import { describe, expect, it } from 'vitest';
import { resolveCleanupRg } from '../flags.js';

describe('resolveCleanupRg', () => {
  it('enables ripgrep only when --rg is passed', () => {
    expect(resolveCleanupRg({ rg: true })).toBe(true);
    expect(resolveCleanupRg({ rg: false })).toBe(false);
    expect(resolveCleanupRg({})).toBe(false);
  });
});
