/** Misconfigured: locale_directory without required structure (readiness should fail). */
export default {
  locales: {
    source: 'messages/en/common.json',
    directory: 'messages',
    mode: 'locale_directory',
  },
  src: 'src',
  functions: ['t'],
};
