/**
 * Minimal translate block for fixture configs — enables `generate --dry-run` without network.
 * `primary: google` with `policy.routing: single` avoids handoff; dry-run never calls providers.
 */
export const fixtureTranslate = {
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
};

export default fixtureTranslate;
