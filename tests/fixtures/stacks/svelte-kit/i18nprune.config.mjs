/** SvelteKit-shaped smoke — `.svelte` + locale_directory / locale_per_dir. */
export default {
  locales: {
    source: 'messages/en/app.json',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'locale_per_dir',
  },
  src: 'src',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
};
