import { describe, it, expect } from 'vitest';
import { mask, restore, validateRestored } from '@/core/placeholders/index.js';

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
});
