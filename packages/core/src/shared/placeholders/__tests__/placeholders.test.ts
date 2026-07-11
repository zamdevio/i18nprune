import { describe, it, expect } from 'vitest';
import {
  containsPlaceholderSentinelLeak,
  isPlaceholderOnlyLeaf,
  mask,
  restore,
  validateRestored,
} from '../index.js';

describe('placeholders', () => {
  it('mask and restore', () => {
    const { text, originals } = mask('Hello {{name}}');
    expect(text).toContain('__I18NPRUNE_');
    const back = restore(`X${text}X`, originals);
    expect(back).toContain('{{name}}');
  });

  it('validateRestored', () => {
    const { text, originals } = mask('a {{b}} c');
    const restored = restore(text, originals);
    validateRestored('a {{b}} c', restored, originals);
  });

  it('restores MyMemory-style spaced sentinels', () => {
    const source = '{{who}} · {{status}} · {{priority}}';
    const { originals } = mask(source);
    const mangled = '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __ · __ I18NPRUNE_2 __';
    const restored = restore(mangled, originals);
    expect(restored).toBe(source);
    validateRestored(source, restored, originals);
  });

  it('detects spaced sentinel leaks after failed restore', () => {
    expect(containsPlaceholderSentinelLeak('__ I18NPRUNE_0 __')).toBe(true);
    expect(containsPlaceholderSentinelLeak('__I18NPRUNE _0__ · __I18NPRUNE _1__')).toBe(true);
    expect(containsPlaceholderSentinelLeak('{{name}}')).toBe(false);
    expect(containsPlaceholderSentinelLeak('__I18NPRUNE_MISSING__')).toBe(false);
    expect(() => validateRestored('{{a}}', '__ I18NPRUNE_0 __', ['a'])).toThrow(
      /placeholder sentinels/,
    );
  });

  it('restores MyMemory-style space-before-index sentinels', () => {
    const source = '{{who}} · {{status}}';
    const { originals } = mask(source);
    const mangled = '__I18NPRUNE _0__ · __I18NPRUNE _1__';
    expect(restore(mangled, originals)).toBe(source);
  });

  it('isPlaceholderOnlyLeaf', () => {
    expect(isPlaceholderOnlyLeaf('{{who}} · {{status}} · {{priority}}')).toBe(true);
    expect(isPlaceholderOnlyLeaf('{{pageTitle}} · {{siteName}}')).toBe(true);
    expect(isPlaceholderOnlyLeaf('{{name}}')).toBe(true);
    expect(isPlaceholderOnlyLeaf('Hello {{name}}')).toBe(false);
    expect(isPlaceholderOnlyLeaf('plain text')).toBe(false);
  });
});
