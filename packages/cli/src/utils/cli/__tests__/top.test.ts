import { describe, it, expect } from 'vitest';
import { parseCliPositiveIntTop } from '@/utils/cli/top.js';

describe('parseCliPositiveIntTop', () => {
  it('returns undefined when omitted', () => {
    expect(parseCliPositiveIntTop(undefined, 'x')).toBeUndefined();
    expect(parseCliPositiveIntTop('', 'x')).toBeUndefined();
  });

  it('parses positive integers', () => {
    expect(parseCliPositiveIntTop('10', 'missing: --top')).toBe(10);
    expect(parseCliPositiveIntTop('1', 'review: --top')).toBe(1);
  });

  it('throws USAGE for invalid values', () => {
    expect(() => parseCliPositiveIntTop('0', 'missing: --top')).toThrow(/positive integer/i);
    expect(() => parseCliPositiveIntTop('-1', 'review: --top')).toThrow(/positive integer/i);
    expect(() => parseCliPositiveIntTop('nope', 'review: --top')).toThrow(/positive integer/i);
  });
});
