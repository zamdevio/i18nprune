# `runQuality` SDK Example

Programmatic use of `@i18nprune/core`'s `runQuality` from a Node script. This is the same source-identical leaf counter the CLI command uses; the CLI adds context resolution, cached report loading, JSON envelope shaping, and human summaries.

## What This Example Shows

1. Building `RuntimeAdapters` explicitly with `createNodeRuntimeAdapters()`.
2. Authoring config in `i18nprune.config.ts` with `defineConfig` and importing it directly.
3. Building a `CoreContext` (config + adapters + env + paths + run flags).
4. Implementing `QualityHostHooks` for dynamic-site counts.
5. Calling `runQuality(ctx, opts, host)`.
6. Reading `payload` and `issues`.

## Files

- `runQuality.ts` — the example, top-to-bottom commented.
- `i18nprune.config.ts` — project config authored with `defineConfig`.
- `locales/en.json` — sample source locale.
- `locales/fr.json` — sample target locale with source-identical leaves.

## Run It

From the repo root:

```bash
pnpm tsx examples/sdk/quality/runQuality.ts
```

## Key Takeaways

- **Core owns locale reads and counting.** It reads source/target JSON via adapters and applies parity exclusions from config.
- **Host hooks supply scan context.** The CLI uses cached report data; custom hosts can supply their own dynamic-site count.
- **Output is not a CLI envelope.** SDK consumers get `{ payload, issues }`; the CLI wraps that in its stable `--json` envelope.
