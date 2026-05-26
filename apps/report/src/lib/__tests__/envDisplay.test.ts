import { describe, it, expect } from 'vitest';
import { envDisplayValue } from '../share/envDisplay.js';

describe('envDisplayValue', () => {
  it('returns em dash for undefined and blank', () => {
    expect(envDisplayValue(undefined)).toBe('—');
    expect(envDisplayValue('')).toBe('—');
    expect(envDisplayValue('   ')).toBe('—');
  });

  it('preserves recorded values including placeholders', () => {
    expect(envDisplayValue('-')).toBe('-');
    expect(envDisplayValue('cloudflare-worker')).toBe('cloudflare-worker');
    expect(envDisplayValue('linux-wsl')).toBe('linux-wsl');
  });
});
