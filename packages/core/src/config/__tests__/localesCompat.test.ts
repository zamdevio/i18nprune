import { describe, expect, it } from 'vitest';
import { collectLocalesFilesystemConfigWarnings } from '../schema/localesCompat.js';

describe('collectLocalesFilesystemConfigWarnings', () => {
  it('warns when structure is set under flat_file mode', () => {
    const warnings = collectLocalesFilesystemConfigWarnings({
      source: 'locales/en.json',
      directory: 'locales',
      mode: 'flat_file',
      structure: 'locale_per_dir',
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('flat_file');
    expect(warnings[0]).toContain('locale_per_dir');
  });

  it('warns when locale_file structure is set under locale_directory mode', () => {
    const warnings = collectLocalesFilesystemConfigWarnings({
      source: 'messages/en/auth.json',
      directory: 'messages',
      mode: 'locale_directory',
      structure: 'locale_file',
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('locale_directory');
  });

  it('returns no warnings for compatible pairs', () => {
    expect(
      collectLocalesFilesystemConfigWarnings({
        source: 'locales/en.json',
        directory: 'locales',
        mode: 'flat_file',
        structure: 'locale_file',
      }),
    ).toHaveLength(0);
    expect(
      collectLocalesFilesystemConfigWarnings({
        source: 'messages/en/auth.json',
        directory: 'messages',
        mode: 'locale_directory',
        structure: 'locale_per_dir',
      }),
    ).toHaveLength(0);
  });
});
