import { defineConfig, type ExpgovConfig } from '@expgov/cli/core';

// Tier rules migrated from scripts/exports/inventory/tiers.ts (pre–EX-3 bootstrap heuristics).
// That classifier defaulted unmatched symbols to stable; expgov requires explicit buckets or @sdkTier —
// expect validate failures until EX-3 allowlist / tag migration completes.

export default defineConfig({
  packageName: '@i18nprune/core',
  core: {
    dir: 'packages/core',
    rootBarrel: 'packages/core/src/index.ts',
    subpaths: {
      '.': 'src/index.ts',
    },
  },
  tsconfig: 'tsconfig.json',
  cache: {
    dir: '.exports/cache',
  },
  git: {
    tagPattern: 'v*',
    timelineBarrelPath: 'packages/core/src/index.ts',
  },
  tiers: {
    stable: {
      exact: ['defineConfig', 'loadConfig'],
      prefix: [
        'ISSUE_',
        '^run[A-Z]',
        '^create[A-Z].*Context$',
        // Common SDK entrypoints (still stable under legacy tiers.ts default)
        'run',
        'build',
        'emit',
        'get',
        'set',
        'reset',
        'is',
        'format',
        'resolve',
        'walk',
        'directory',
        'normalize',
        'rethrow',
        'noop',
      ],
    },
    internal: {
      exact: ['wrapCoreEnvelope', 'unwrapCoreEnvelope'],
      prefix: ['internal', 'Internal$'],
    },
    advanced: {
      exact: [
        'IdentityAbortError',
        'TRANSLATE_WORKERS_CAP',
        'TRANSLATE_POLICY_DEFAULTS',
      ],
      prefix: [
        '^ENV_TRANSLATE_',
        '^TRANSLATE_',
        '^TRANSLATION_',
        '^DEFAULT_PROVIDER_',
        '^IDENTITY_STREAK_',
        '^Provider',
        '^classifyProvider',
        '^resolveProvider',
        '^createProvider',
        '^isRetryableProvider',
        '^policyKeyFor',
        '^buildTranslateParallel',
        '^mapWithConcurrency',
        '^resolveTranslateMaxParallel',
      ],
    },
  },
} satisfies ExpgovConfig);
