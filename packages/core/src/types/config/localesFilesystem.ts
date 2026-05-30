/** Locale bundle paths and layout hints (`locales` config block). */
export type LocalesFilesystemConfig = {
  source: string;
  directory: string;
  mode?: 'flat_file' | 'locale_directory';
  structure?: 'locale_file' | 'locale_per_dir' | 'feature_bundle';
};
