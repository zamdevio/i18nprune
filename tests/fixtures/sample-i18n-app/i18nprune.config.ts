/** Fixture config — plain object (no package import) so Vitest can load without linking npm. */
export default {
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
};
