import { describe, expect, it } from 'vitest';
import { resolveGenerateDirectionDefault } from '@i18nprune/core';

describe('resolveGenerateDirectionDefault', () => {
  it('prefers explicit direction when provided', () => {
    expect(
      resolveGenerateDirectionDefault({
        explicitDirection: 'ltr',
        targetCode: 'ar',
        catalogDirection: 'rtl',
      }),
    ).toBe('ltr');
  });

  it('uses catalog direction when explicit direction is omitted', () => {
    expect(
      resolveGenerateDirectionDefault({
        targetCode: 'ar',
        catalogDirection: 'rtl',
      }),
    ).toBe('rtl');
  });

  it('falls back to RTL heuristic for unknown catalog direction', () => {
    expect(
      resolveGenerateDirectionDefault({
        targetCode: 'ckb-IR',
        catalogDirection: undefined,
      }),
    ).toBe('rtl');
  });
});
