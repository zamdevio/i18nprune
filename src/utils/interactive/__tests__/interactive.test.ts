import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';

describe('shouldSkipInteractivePrompts', () => {
  const saved = { ...process.env };
  const savedIsTTY = process.stdin.isTTY;

  beforeEach(() => {
    process.env = { ...saved };
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
  });

  afterEach(() => {
    process.env = saved;
    Object.defineProperty(process.stdin, 'isTTY', { value: savedIsTTY, configurable: true });
  });

  it('returns true when CI=1', () => {
    process.env.CI = '1';
    expect(shouldSkipInteractivePrompts()).toBe(true);
  });

  it('returns true when stdin is not a TTY', () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    expect(shouldSkipInteractivePrompts()).toBe(true);
  });

  it('returns false in interactive-like environment', () => {
    delete process.env.CI;
    delete process.env.I18NPRUNE_NO_INIT;
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    expect(shouldSkipInteractivePrompts()).toBe(false);
  });
});
