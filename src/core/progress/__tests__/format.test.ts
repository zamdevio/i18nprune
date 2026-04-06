import { describe, it, expect } from 'vitest';
import { truncateMiddle, formatDurationMs } from '@/core/progress/format.js';

describe('progress format', () => {
  it('truncateMiddle', () => {
    expect(truncateMiddle('ab', 10)).toBe('ab');
    expect(truncateMiddle('abcdefghijklmnop', 8).includes('…')).toBe(true);
  });

  it('formatDurationMs', () => {
    expect(formatDurationMs(500)).toMatch(/ms/);
    expect(formatDurationMs(5000)).toMatch(/s/);
  });
});
