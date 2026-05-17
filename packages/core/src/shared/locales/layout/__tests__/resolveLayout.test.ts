import { describe, expect, it } from 'vitest';
import {
  isLocalesLayoutReadSupported,
  isLocalesLayoutWriteSupported,
  resolveLocalesLayout,
} from '../resolveLayout.js';

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

  it('throws when locale_directory mode omits structure', () => {
    expect(() =>
      resolveLocalesLayout(
        { source: 'messages/en.json', directory: 'messages', mode: 'locale_directory' },
        '/proj/messages',
      ),
    ).toThrow(/locales\.structure is required/);
  });

  it('supports flat_file + locale_file for read and write', () => {
    const layout = resolveLocalesLayout(
      { source: 'locales/en.json', directory: 'locales', mode: 'flat_file', structure: 'locale_file' },
      '/proj/locales',
    );
    expect(isLocalesLayoutWriteSupported(layout)).toBe(true);
    expect(isLocalesLayoutReadSupported(layout)).toBe(true);
  });

  it('supports locale_directory + feature_bundle for read and write', () => {
    const layout = resolveLocalesLayout(
      {
        source: 'locales/auth/en.json',
        directory: 'locales',
        mode: 'locale_directory',
        structure: 'feature_bundle',
      },
      '/proj/locales',
    );
    expect(isLocalesLayoutReadSupported(layout)).toBe(true);
    expect(isLocalesLayoutWriteSupported(layout)).toBe(true);
  });
});
