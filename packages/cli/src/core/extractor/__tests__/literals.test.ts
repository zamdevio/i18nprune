import { describe, it, expect } from 'vitest';
import { exactLiteralKeys } from '@/core/extractor/literals.js';

describe('exactLiteralKeys', () => {
  it('finds t() string keys', () => {
    const text = `const x = t('foo.bar'); t("other.key")`;
    const keys = exactLiteralKeys(text, ['t'], {});
    expect(keys.has('foo.bar')).toBe(true);
    expect(keys.has('other.key')).toBe(true);
  });
});
