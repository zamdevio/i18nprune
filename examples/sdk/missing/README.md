# `runMissing` SDK Example

Programmatic use of `@i18nprune/core`'s `runMissing` from a Node script. This is the same missing-key planner the CLI command uses; the CLI adds context resolution, cached report loading, confirmation prompts, JSON envelope shaping, and human summaries.

## What This Example Shows

1. Building `RuntimeAdapters` explicitly with `createNodeRuntimeAdapters()`.
2. Authoring config in `i18nprune.config.ts` with `defineConfig` and importing it directly.
3. Building a `CoreContext` (config + adapters + env + paths + run flags).
4. Implementing `MissingHostHooks` for resolved literal keys and dynamic-site counts.
5. Calling `runMissing(ctx, opts, host)` with `dryRun: true`.
6. Reading `payload`, `issues`, and target plans.

## Files

- `runMissing.ts` — the example, top-to-bottom commented.
- `i18nprune.config.ts` — project config authored with `defineConfig`.
- `locales/en.json` — sample source locale with intentionally missing keys.

## Run It

From the repo root:

```bash
pnpm tsx examples/sdk/missing/runMissing.ts
```

The example runs with `dryRun: true`, so no files are written. A real host can call `writeMissingPaths` after user confirmation to persist the planned paths.

## Key Takeaways

- **Core owns the plan.** It reads the selected source/target locale JSON via adapters and returns target plans with paths to add.
- **Host hooks supply scan data.** The CLI uses cached report data; custom hosts can supply their own resolved-key set.
- **Writes are opt-in.** Plan first with `runMissing`, then write through `writeMissingPaths` only after your host policy allows mutation.
- **Output is not a CLI envelope.** SDK consumers get `{ payload, issues }`; the CLI wraps that in its stable `--json` envelope.
