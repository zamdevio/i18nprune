import { describe, expect, it } from 'vitest';
import { inferLocaleLayoutFromConfigPaths } from '../inferLayoutFromConfigPaths.js';

describe('inferLocaleLayoutFromConfigPaths', () => {
  it('infers flat_file from root-level source path', () => {
    expect(inferLocaleLayoutFromConfigPaths('locales', 'locales/en.json')).toMatchObject({
      mode: 'flat_file',
      structure: 'locale_file',
    });
  });

  it('infers locale_per_dir from nested source path', () => {
    expect(inferLocaleLayoutFromConfigPaths('messages', 'messages/en/common.json')).toMatchObject({
      mode: 'locale_directory',
      structure: 'locale_per_dir',
    });
  });

  it('infers feature_bundle from feature-first source path', () => {
    expect(inferLocaleLayoutFromConfigPaths('locales', 'locales/auth/en.json')).toMatchObject({
      mode: 'locale_directory',
      structure: 'feature_bundle',
    });
  });
});
