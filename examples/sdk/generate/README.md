# `runGenerate` SDK example

Programmatic use of `@i18nprune/core`'s `runGenerate` from a Node script. This is the same engine the CLI's `i18nprune generate` command uses — the CLI is just one host with TTY prompts and a progress bar.

## What this example shows

1. Building `RuntimeAdapters` explicitly with `createNodeRuntimeAdapters()` — no auto-default.
2. Authoring config in `i18nprune.config.ts` with `defineConfig` and importing it directly.
3. Building a `CoreContext` (config + adapters + env + paths + run flags).
4. Implementing a **headless** `GenerateHostHooks` (no TTY, no prompts, `run.message` to stderr).
5. (Optional) `GenerateRunHooks` for mid-run consent points (`onIncomplete`, `onHandoffPick`).
6. Calling `runGenerate(ctx, opts, host, hooks?)` and reading `payload.targetResults`.

## Files

- `runGenerate.ts` — the example, top-to-bottom commented.
- `i18nprune.config.ts` — project config authored with `defineConfig` (the supported format; `.json` configs are intentionally not loaded).
- `locales/en.json` — sample source locale.

## Run it

From the repo root:

```bash
pnpm tsx examples/sdk/generate/runGenerate.ts
```

The example runs with `dryRun: true` so no files are written. Drop that flag to write `locales/fr.json` and `locales/es.json` next to the source.

## Key takeaways for SDK consumers

- **Adapters are explicit.** Workers / web / edge use `@i18nprune/core/runtime/web` or `/edge` and pass the result the same way.
- **`env` is explicit.** Core never reads `process.env` itself; you pass what you want exposed (CLI passes `process.env`, a worker might pass a curated subset).
- **Config is authored once.** `defineConfig` in `i18nprune.config.ts` returns the public `I18nPruneConfig` directly — drop it into `createCoreContext` with no extra cast. Use `parseI18nPruneConfig` when accepting raw input from a REST/DB caller, or `loadCoreConfigFromPath` for full file-on-disk loading with layering and warnings.
- **Host hooks are the only TTY/UI plug-in point.** Anything that prints, prompts, or relays progress goes through them — core stays free of `console.*` and `process.*`.
- **Run hooks are optional and additive.** Omit them and you get today's CLI behavior (linear provider chain, throw on chain exhaustion). Implement them for custom mid-run decisions.
- **`preloadedRaw`** lets the host emit its own `read_source` event before calling `runGenerate`, so the run-event order stays stable when the host has already read the file.
