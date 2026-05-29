/** React / Vite-shaped stack smoke — `.tsx` with `t()` + cache profile. */
export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
  cache: { profile: 'balanced' },
  policies: { preserve: {}, parity: {} },
};
