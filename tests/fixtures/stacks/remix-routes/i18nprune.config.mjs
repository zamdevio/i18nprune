/** Remix-shaped route modules under `app/routes/`. */
export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
  },
  src: 'app',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
};
