import { describe, it, expect } from 'vitest';
import { truncateMiddle, formatDurationMs, toUnicodeSuperscriptInt } from '@/shared/progress/format.js';

describe('progress format', () => {
  it('toUnicodeSuperscriptInt', () => {
    expect(toUnicodeSuperscriptInt(0)).toBe('⁰');
    expect(toUnicodeSuperscriptInt(1)).toBe('¹');
    expect(toUnicodeSuperscriptInt(12)).toBe('¹²');
  });

  it('truncateMiddle', () => {
    expect(truncateMiddle('ab', 10)).toBe('ab');
    expect(truncateMiddle('abcdefghijklmnop', 8).includes('…')).toBe(true);
  });

  it('formatDurationMs', () => {
    expect(formatDurationMs(500)).toMatch(/ms/);
    expect(formatDurationMs(5000)).toMatch(/s/);
  });
});
