import { describe, expect, it } from 'vitest';
import { resolveNoColor } from '@/utils/cli/noColor.js';

describe('resolveNoColor', () => {
  it('honors --no-color flag', () => {
    expect(resolveNoColor(true, {})).toBe(true);
  });

  it('honors NO_COLOR env when flag is off', () => {
    expect(resolveNoColor(false, { NO_COLOR: '1' })).toBe(true);
    expect(resolveNoColor(false, { NO_COLOR: '' })).toBe(true);
  });

  it('defaults to color when neither flag nor env is set', () => {
    expect(resolveNoColor(false, {})).toBe(false);
  });
});
