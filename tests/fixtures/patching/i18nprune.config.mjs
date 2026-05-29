/** Patching demo — config/registry drift until `patch --fix`. See README.md. */
export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
  cache: { enabled: false },
  localeLeaves: { mode: 'legacy_string' },
  translate: {
    primary: 'mymemory',
    workers: 2,
    providers: [
      {
        id: 'mymemory',
        enabled: true,
        rateLimit: { maxConcurrency: 2, rpm: 30, rps: 0.5, intervalMs: 500 },
      },
    ],
    policy: {
      routing: 'single',
      onRateLimit: 'backoff',
      onTransientFailure: 'retry',
      onQuotaExceeded: 'fallback',
      onAuthFailure: 'abort',
      onProviderUnavailable: 'fallback',
      onIdentityOutput: 'flag',
      onIncompleteRun: 'confirm',
      handoff: 'auto',
    },
  },
  patching: {
    enabled: true,
    recipe: "loader_generated",
    configPath: "src/i18n/config.json",
    loaderPath: "src/i18n/loaders.generated.ts",
    localeJsonImportBase: "locales",
  },
};
