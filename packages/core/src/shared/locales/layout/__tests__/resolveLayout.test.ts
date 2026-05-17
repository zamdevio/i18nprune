import { describe, expect, it } from 'vitest';
import { isLocalesLayoutSupported, resolveLocalesLayout } from '../resolveLayout.js';

describe('resolveLocalesLayout', () => {
  it('defaults mode flat_file and structure locale_file', () => {
    const layout = resolveLocalesLayout(
      { source: 'locales/en.json', directory: '/proj/locales' },
      '/proj/locales',
    );
    expect(layout.mode).toBe('flat_file');
    expect(layout.structure).toBe('locale_file');
    expect(layout.directoryAbsolute).toBe('/proj/locales');
  });

  it('defaults structure locale_per_dir for locale_directory mode', () => {
    const layout = resolveLocalesLayout(
      { source: 'messages/en.json', directory: 'messages', mode: 'locale_directory' },
      '/proj/messages',
    );
    expect(layout.mode).toBe('locale_directory');
    expect(layout.structure).toBe('locale_per_dir');
    expect(isLocalesLayoutSupported(layout)).toBe(false);
  });

  it('supports flat_file + locale_file only in phase 1', () => {
    const layout = resolveLocalesLayout(
      { source: 'locales/en.json', directory: 'locales', mode: 'flat_file', structure: 'locale_file' },
      '/proj/locales',
    );
    expect(isLocalesLayoutSupported(layout)).toBe(true);
  });
});
