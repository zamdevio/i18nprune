/** locale_directory + locale_per_dir — one folder per locale code. */
export default {
  locales: {
    source: 'messages/en/common.json',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'locale_per_dir',
  },
  src: 'src',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
};
