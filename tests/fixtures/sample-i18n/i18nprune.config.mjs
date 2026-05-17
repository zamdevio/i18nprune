/**
 * Minimal fixture config — see `README.md` in this directory.
 * Includes **`translate`** so **`generate`** parity / integration tests can run dry.
 */
export default {
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  translate: {
    primary: 'google',
    workers: 32,
    providers: [
      {
        id: 'google',
        rateLimit: { maxConcurrency: 32, rpm: 1920, rps: 32, intervalMs: 32 },
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
  policies: {
    preserve: {},
    parity: {},
  },
};
