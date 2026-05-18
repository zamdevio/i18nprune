/** flat_file + locale_file — one JSON file per locale at the bundle root. */
export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
    mode: 'flat_file',
    structure: 'locale_file',
  },
  src: 'src',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
};
