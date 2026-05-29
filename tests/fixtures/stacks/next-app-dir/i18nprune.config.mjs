/** Next.js App Router-shaped stack smoke — `app/` TSX with `t()`. */
export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
  },
  src: 'app',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
};
