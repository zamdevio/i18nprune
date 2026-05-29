/** Nuxt-shaped paths — `src/pages` + `src/components` Vue SFCs. */
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
