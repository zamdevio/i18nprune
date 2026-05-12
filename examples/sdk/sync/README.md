# `runSync` SDK example

Programmatic use of `@i18nprune/core`'s `runSync` from a Node script. This is the same sync engine the CLI command uses; the CLI adds context resolution, cached report loading, JSON envelope shaping, and human summaries.

## What this example shows

1. Building `RuntimeAdapters` explicitly with `createNodeRuntimeAdapters()`.
2. Authoring config in `i18nprune.config.ts` with `defineConfig` and importing it directly.
3. Building a `CoreContext` (config + adapters + env + paths + run flags).
4. Implementing headless `SyncHostHooks` for progress and reference data.
5. Calling `runSync(ctx, opts, host)` with `dryRun: true`.
6. Reading `payload`, `issues`, and per-file human leaf summaries.

## Files

- `runSync.ts` — the example, top-to-bottom commented.
- `i18nprune.config.ts` — project config authored with `defineConfig`.
- `locales/en.json` — sample source locale.
- `locales/fr.json` — sample target locale with missing and extra keys.

## Run It

From the repo root:

```bash
pnpm tsx examples/sdk/sync/runSync.ts
```

The example runs with `dryRun: true`, so no files are written. Drop that flag to rewrite `locales/fr.json` toward the source shape.

## Key Takeaways

- **Adapters are explicit.** Core never picks Node/Web/Edge by itself.
- **`env` is explicit.** Sync does not read environment variables, but project ops use the same context shape.
- **Host hooks supply host-owned data.** The CLI hook loads cached report details; custom hosts can supply their own key observations and dynamic sites.
- **Core returns payload and issues.** The CLI wraps them in its stable `--json` envelope; SDK consumers can format or transport them however they need.
