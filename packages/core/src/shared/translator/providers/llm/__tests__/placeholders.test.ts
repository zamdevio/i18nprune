import { describe, expect, it } from 'vitest';
import {
  assertLlmOutputPreservesPlaceholders,
  countI18nPrunePlaceholderTokens,
} from '../placeholders.js';

describe('countI18nPrunePlaceholderTokens', () => {
  it('counts mask tokens', () => {
    expect(countI18nPrunePlaceholderTokens('a __I18NPRUNE_Q_0__ b')).toBe(1);
    expect(countI18nPrunePlaceholderTokens('__I18NPRUNE_Q_0____I18NPRUNE_B_1__')).toBe(2);
  });
});

describe('assertLlmOutputPreservesPlaceholders', () => {
  it('passes when counts match', () => {
    expect(() =>
      assertLlmOutputPreservesPlaceholders('x __I18NPRUNE_Q_0__', 'y __I18NPRUNE_Q_0__'),
    ).not.toThrow();
  });

  it('throws when output drops a token', () => {
    expect(() => assertLlmOutputPreservesPlaceholders('x __I18NPRUNE_Q_0__', 'y')).toThrow(/dropped/);
  });
});
