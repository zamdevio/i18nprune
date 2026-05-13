import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config';

export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  translate: {
    primary: 'google',
    workers: 32,
    providers: [
      { id: 'google', rateLimit: { maxConcurrency: 32, rpm: 1920, rps: 32, intervalMs: 32 } },
      // The order of `providers[]` IS the auto-routing chain (`policy.routing: 'auto'` walks
      // top-to-bottom on retryable failures). `--provider` / `I18NPRUNE_TRANSLATE_PROVIDER`
      // pins an id to the FRONT of the chain without disabling fallback. Set `enabled: false`
      // (or comment the row) to skip a provider.
      // Uncomment one row at a time · set `translate.primary` · use env vars where noted (run `i18nprune providers`).
      // { id: 'mymemory', enabled: true, contactEmail: 'you@example.com', rateLimit: { maxConcurrency: 2, rpm: 60, rps: 1, intervalMs: 1000 } },
      // { id: 'libre', enabled: true, baseUrl: 'https://libretranslate.com', rateLimit: { maxConcurrency: 6, rpm: 120, rps: 2, intervalMs: 500 } },
      // { id: 'deepl', enabled: true, apiKey: process.env.I18NPRUNE_TRANSLATE_DEEPL_API_KEY, rateLimit: { maxConcurrency: 4, rpm: 90, rps: 1.5, intervalMs: 600 } },
      // {
      //   id: 'llm',
      //   enabled: true,
      //   apiKey: process.env.I18NPRUNE_TRANSLATE_LLM_API_KEY,
      //   baseUrl: process.env.I18NPRUNE_TRANSLATE_LLM_BASE_URL ?? 'https://api.openai.com/v1',
      //   model: process.env.I18NPRUNE_TRANSLATE_LLM_MODEL ?? 'gpt-4o-mini',
      //   rateLimit: { maxConcurrency: 2, rpm: 30, rps: 0.5, intervalMs: 1500 },
      // },
    ],
    // Per-outcome verbs consumed by the translate-policy resolver. All keys optional.
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
      // maxAttempts: providers.length, // omit to use one shot per provider in chain
    },
  },

  policies: {
    preserve: {
      // copyKeys: ['brand.tagline'],
      // copyPrefixes: ['legal.'],
    },
    parity: {
      // excludeKeys: ['debug.flag'],
      // excludePrefixes: ['experimental.'],
      // excludeValues: ['TODO'],
    },
  },

  exclude: {
    preset: 'production',
    useDefaultSkip: true,
    // dirs: ['fixtures', 'vendor'],
    // files: ['ignored-keys.ts'],
    // extensions: ['d.ts'],
    // patterns: [/^src\/generated\//],
  },

  reference: {
    defaults: {
      treatCommentedCallSitesAsRuntime: false,
      treatNonSourceFileSitesAsRuntime: false,
      uncertainKeyPolicy: 'protect',
      stringPresence: 'guard',
      stringPresenceMaxHitsPerKey: 5,
      respectPreserve: true,
    },
    // Per-command overrides: add `commands: { cleanup?: {…}, sync?: {…}, generate?: {…} }` using the SAME field keys as `defaults`.
    // Each block shallow-merges over `defaults` when that command runs (documented keys only; omit `commands` until you need a divergence).
    // See repo `docs/reference/` and types `ReferenceConfig` via `i18nprune/core/config`.
  },

  localeLeaves: {
    // `mode`: **`legacy_string`** (plain string leaves) or **`structured`** (`{ value, … }` terminals) — only these two values are valid.
    mode: 'legacy_string',
    sync: {
      // When **`true`**, sync can strip structured metadata back to plain strings (see `sync --strip-metadata`).
      stripMetadata: false,
    },
  },

  missing: {
    // Omit `placeholder` → core default __I18NPRUNE_MISSING__; set any string you want merged at new paths (grep-friendly sentinel recommended).
    placeholder: '__I18NPRUNE_MISSING__',
  },
  output: {
    list: {
      top: 10,
      full: false,
      // maxCap: 100000,
    },
  },

  scanner: {
    // `auto` picks serial vs concurrent; tune for huge repos.
    mode: 'auto',
    // concurrency: 8,
    // hardCap: 256,
  },

  cache: {
    // Core-owned project analysis cache. Omit `dir` to use the host default (CLI: ~/.i18nprune/cache).
    enabled: true,
    // dir: '.i18nprune/cache',
  },

  patching: {
    // Opt-in: may create/refresh loader wiring under `src` — keep `enabled: false` until you deliberately adopt the patching recipe.
    enabled: false,
    recipe: 'loader_generated',
    mode: 'warn_skip',
    // loaderPath: 'src/i18n/loaders.generated.ts',
    // configPath: 'src/i18n/config.json',
    // localeJsonImportBase: 'locales',
    // sizeLimitBytes: 524288,
  },

  // When `true`, `generate` skips **`<lang>.meta.json`** (same effect as CLI `--no-locale-meta`; either skips).
  noLocaleMeta: false,

} satisfies Partial<I18nPruneConfig>);
