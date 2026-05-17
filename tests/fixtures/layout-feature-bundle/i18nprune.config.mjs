/** locale_directory + feature_bundle — feature folders with <locale>.json inside. */
export default {
  locales: {
    source: 'messages/auth/en.json',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'feature_bundle',
  },
  src: 'src',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
};
